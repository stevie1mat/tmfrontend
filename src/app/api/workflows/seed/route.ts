import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'trademinutes';

async function getDb() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db(dbName);
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    
    // Sample published workflows
    const sampleWorkflows = [
      {
        userId: 'demo-user-1',
        name: 'Content Creation Assistant',
        description: 'An AI agent that helps create engaging blog posts, social media content, and marketing copy. Perfect for content creators and marketers.',
        category: 'Content Creation',
        price: 25,
        rating: 4.8,
        reviews: 12,
        coverImage: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['Blog post generation', 'Social media content', 'SEO optimization', 'Brand voice consistency'],
        authorName: 'ContentPro AI',
        authorAvatar: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        published: true,
        nodes: [
          { id: '1', type: 'input', data: { label: 'Topic' } },
          { id: '2', type: 'process', data: { label: 'Research' } },
          { id: '3', type: 'output', data: { label: 'Content' } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ],
        createdAt: new Date()
      },
      {
        userId: 'demo-user-2',
        name: 'Data Analysis Expert',
        description: 'Advanced data analysis and visualization agent that can process large datasets, create charts, and generate insights for business decisions.',
        category: 'Data Analysis',
        price: 35,
        rating: 4.9,
        reviews: 8,
        coverImage: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['Data processing', 'Chart generation', 'Statistical analysis', 'Report creation'],
        authorName: 'DataWiz AI',
        authorAvatar: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        published: true,
        nodes: [
          { id: '1', type: 'input', data: { label: 'Dataset' } },
          { id: '2', type: 'process', data: { label: 'Analyze' } },
          { id: '3', type: 'output', data: { label: 'Insights' } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ],
        createdAt: new Date()
      },
      {
        userId: 'demo-user-3',
        name: 'Customer Service Bot',
        description: 'Intelligent customer service agent that can handle inquiries, provide support, and escalate issues when needed.',
        category: 'Customer Service',
        price: 20,
        rating: 4.6,
        reviews: 15,
        coverImage: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['24/7 support', 'Multi-language', 'Issue tracking', 'Escalation handling'],
        authorName: 'SupportAI',
        authorAvatar: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        published: true,
        nodes: [
          { id: '1', type: 'input', data: { label: 'Customer Query' } },
          { id: '2', type: 'process', data: { label: 'Process' } },
          { id: '3', type: 'output', data: { label: 'Response' } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ],
        createdAt: new Date()
      },
      {
        userId: 'demo-user-4',
        name: 'Code Review Assistant',
        description: 'AI-powered code review agent that analyzes code quality, suggests improvements, and identifies potential bugs and security issues.',
        category: 'Development',
        price: 30,
        rating: 4.7,
        reviews: 10,
        coverImage: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['Code analysis', 'Bug detection', 'Security scanning', 'Best practices'],
        authorName: 'CodeGuard AI',
        authorAvatar: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        published: true,
        nodes: [
          { id: '1', type: 'input', data: { label: 'Code' } },
          { id: '2', type: 'process', data: { label: 'Review' } },
          { id: '3', type: 'output', data: { label: 'Feedback' } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ],
        createdAt: new Date()
      }
    ];
    
    // Insert sample workflows
    const result = await db.collection('workflows').insertMany(sampleWorkflows);
    
    return NextResponse.json({
      success: true,
      message: `Added ${result.insertedCount} sample workflows`,
      insertedIds: Object.values(result.insertedIds)
    });
    
  } catch (err: any) {
    console.error('Error seeding workflows:', err);
    return NextResponse.json({ 
      error: 'Failed to seed workflows',
      message: err.message
    }, { status: 500 });
  }
} 