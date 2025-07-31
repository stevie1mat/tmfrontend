import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build filter based on query parameters
    let filter: any = {}; // Start with no filter to see all workflows
    
    // For now, let's include all workflows (we can add published filter later)
    // let filter: any = { published: true }; // Only return published workflows
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    // Fetch workflows with pagination
    const workflows = await db.collection('workflows')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    console.log('Found workflows:', workflows.length);
    console.log('Filter used:', filter);
    
    // Transform the data to match the expected format
    const transformedWorkflows = workflows.map(wf => ({
      id: wf._id.toString(),
      name: wf.name,
      description: wf.description || 'No description available',
      category: wf.category || 'General',
      price: wf.price || 0,
      rating: wf.rating || 4.5,
      reviews: wf.reviews || 0,
      image: wf.coverImage || 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
      features: wf.features || [],
      demoUrl: `/ai-agents/workflow-chat/${wf._id.toString()}`,
      isFavorite: false,
      type: 'ai-agent',
      nodes: wf.nodes,
      edges: wf.edges,
      createdAt: wf.createdAt,
      author: {
        id: wf.userId,
        name: wf.authorName || 'Anonymous',
        avatar: wf.authorAvatar || ''
      }
    }));
    
    return NextResponse.json({
      data: transformedWorkflows,
      total: transformedWorkflows.length,
      query,
      category
    });
    
  } catch (err: any) {
    console.error('Error fetching public workflows:', err);
    
    // Get query parameters for fallback response
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    
    // Return demo data as fallback
    const demoWorkflows = [
      {
        id: 'demo-1',
        name: 'Content Creation Assistant',
        description: 'An AI agent that helps create engaging blog posts, social media content, and marketing copy.',
        category: 'Content Creation',
        price: 25,
        rating: 4.8,
        reviews: 12,
        image: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['Blog post generation', 'Social media content', 'SEO optimization'],
        demoUrl: '/ai-agents/workflow-chat/demo-1',
        isFavorite: false,
        type: 'ai-agent',
        author: {
          id: 'demo-user-1',
          name: 'ContentPro AI',
          avatar: ''
        }
      },
      {
        id: 'demo-2',
        name: 'Data Analysis Expert',
        description: 'Advanced data analysis and visualization agent for business insights.',
        category: 'Data Analysis',
        price: 35,
        rating: 4.9,
        reviews: 8,
        image: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
        features: ['Data processing', 'Chart generation', 'Statistical analysis'],
        demoUrl: '/ai-agents/workflow-chat/demo-2',
        isFavorite: false,
        type: 'ai-agent',
        author: {
          id: 'demo-user-2',
          name: 'DataWiz AI',
          avatar: ''
        }
      }
    ];
    
    return NextResponse.json({
      data: demoWorkflows,
      total: demoWorkflows.length,
      query,
      category,
      fallback: true
    });
  }
} 