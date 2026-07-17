import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Category from '../models/Category.js';

// Verify JWT and return user, or throw
async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = auth.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || user.isDeleted) {
    throw new Error('User not found or deactivated');
  }
  return user;
}

function buildServer(user) {
  const server = new McpServer({
    name: 'subly',
    version: '1.0.0',
  });

  // ── list_subscriptions ────────────────────────────────────────────────────
  server.tool(
    'list_subscriptions',
    'List all subscriptions for the authenticated user',
    {
      activeOnly: z.boolean().optional().describe('If true, return only active subscriptions'),
      category: z.string().optional().describe('Filter by category name'),
    },
    async ({ activeOnly, category }) => {
      const query = { user: user._id };
      if (activeOnly) query.isActive = true;
      if (category) query.category = category;

      const subs = await Subscription.find(query).sort({ createdAt: -1 });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              subs.map(s => s.toJSON()),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── get_stats ─────────────────────────────────────────────────────────────
  server.tool(
    'get_stats',
    'Get spending statistics (monthly total, yearly total, breakdown by category)',
    {},
    async () => {
      const subscriptions = await Subscription.find({ user: user._id, isActive: true });

      let totalMonthly = 0;
      let totalAnnual = 0;

      subscriptions.forEach(sub => {
        const realCost = sub.isShared ? sub.myRealCost : sub.amount;
        if (sub.billingCycle === 'monthly') {
          totalMonthly += realCost;
        } else {
          totalAnnual += realCost;
          totalMonthly += realCost / 12;
        }
      });

      const byCategory = subscriptions.reduce((acc, sub) => {
        const cat = sub.category || 'Other';
        acc[cat] = (acc[cat] || 0) + sub.myMonthlyCost;
        return acc;
      }, {});

      const stats = {
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalAnnual: Math.round(totalAnnual * 100) / 100,
        totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
        count: subscriptions.length,
        byCategory: Object.fromEntries(
          Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])
        ),
      };

      return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    }
  );

  // ── list_categories ───────────────────────────────────────────────────────
  server.tool(
    'list_categories',
    'List all categories available for the user',
    {},
    async () => {
      const categories = await Category.find({ user: user._id }).sort({ name: 1 });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              categories.map(c => ({ id: c._id, name: c.name, isDefault: c.isDefault })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── create_subscription ───────────────────────────────────────────────────
  server.tool(
    'create_subscription',
    'Create a new subscription',
    {
      name: z.string().min(1).describe('Service name (e.g. Netflix)'),
      amount: z.number().min(0).describe('Price per billing cycle'),
      billingCycle: z.enum(['monthly', 'annual']).describe('Billing cycle'),
      nextBillingDate: z.string().describe('Next billing date (ISO 8601, e.g. 2025-08-01)'),
      category: z.string().optional().describe('Category name'),
      notes: z.string().optional().describe('Optional notes'),
      url: z.string().optional().describe('Service URL'),
      isTrial: z.boolean().optional().describe('Is this a trial subscription?'),
      trialEndDate: z.string().optional().describe('Trial end date (ISO 8601)'),
      isShared: z.boolean().optional().describe('Is this subscription shared?'),
      totalPeople: z.number().int().min(1).optional().describe('Total number of people sharing'),
      peopleWhoPaid: z.number().int().min(1).optional().describe('Number of people who have paid'),
      paymentMethod: z
        .enum(['card', 'paypal', 'crypto', 'bank', 'paysafecard', 'revolut'])
        .nullable()
        .optional()
        .describe('Payment method'),
    },
    async (data) => {
      const subscription = await Subscription.create({
        user: user._id,
        ...data,
        nextBillingDate: new Date(data.nextBillingDate),
        trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : undefined,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Subscription created:\n${JSON.stringify(subscription.toJSON(), null, 2)}`,
          },
        ],
      };
    }
  );

  // ── update_subscription ───────────────────────────────────────────────────
  server.tool(
    'update_subscription',
    'Update an existing subscription by its ID',
    {
      id: z.string().describe('Subscription MongoDB ID'),
      name: z.string().optional(),
      amount: z.number().min(0).optional(),
      billingCycle: z.enum(['monthly', 'annual']).optional(),
      nextBillingDate: z.string().optional().describe('ISO 8601 date'),
      category: z.string().optional(),
      notes: z.string().optional(),
      url: z.string().optional(),
      isActive: z.boolean().optional(),
      isTrial: z.boolean().optional(),
      trialEndDate: z.string().optional().describe('ISO 8601 date'),
      isShared: z.boolean().optional(),
      totalPeople: z.number().int().min(1).optional(),
      peopleWhoPaid: z.number().int().min(1).optional(),
      paymentMethod: z
        .enum(['card', 'paypal', 'crypto', 'bank', 'paysafecard', 'revolut'])
        .nullable()
        .optional(),
    },
    async ({ id, ...updates }) => {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { content: [{ type: 'text', text: 'Error: subscription not found' }], isError: true };
      }
      if (subscription.user.toString() !== user._id.toString()) {
        return { content: [{ type: 'text', text: 'Error: not authorized' }], isError: true };
      }

      if (updates.nextBillingDate) updates.nextBillingDate = new Date(updates.nextBillingDate);
      if (updates.trialEndDate) updates.trialEndDate = new Date(updates.trialEndDate);

      const updated = await Subscription.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Subscription updated:\n${JSON.stringify(updated.toJSON(), null, 2)}`,
          },
        ],
      };
    }
  );

  // ── delete_subscription ───────────────────────────────────────────────────
  server.tool(
    'delete_subscription',
    'Delete a subscription by its ID',
    {
      id: z.string().describe('Subscription MongoDB ID'),
    },
    async ({ id }) => {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        return { content: [{ type: 'text', text: 'Error: subscription not found' }], isError: true };
      }
      if (subscription.user.toString() !== user._id.toString()) {
        return { content: [{ type: 'text', text: 'Error: not authorized' }], isError: true };
      }

      await subscription.deleteOne();

      return {
        content: [{ type: 'text', text: `Subscription "${subscription.name}" deleted successfully` }],
      };
    }
  );

  return server;
}

// Express route handler for Streamable HTTP MCP
export async function mcpHandler(req, res) {
  let user;
  try {
    user = await authenticate(req);
  } catch (err) {
    res.status(401).json({ error: err.message });
    return;
  }

  const server = buildServer(user);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
