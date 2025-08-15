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
    const body = await req.json();
    const userId = req.headers.get('user-id') || 'demo-user'; // Replace with real auth
    const { name, nodes, edges, description, credits, coverImage } = body;
    if (!name || !nodes || !edges) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const workflow = {
      userId,
      name,
      nodes,
      edges,
      description: description || '',
      credits: parseInt(credits) || 0,
      coverImage: coverImage || null,
      createdAt: new Date(),
    };
    const result = await db.collection('workflows').insertOne(workflow);
    return NextResponse.json({ id: result.insertedId, ...workflow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const userId = req.headers.get('user-id') || 'demo-user';
    const workflows = await db.collection('workflows')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(workflows.map(wf => ({
      id: wf._id.toString(),
      name: wf.name,
      nodes: wf.nodes,
      edges: wf.edges,
      createdAt: wf.createdAt,
      published: wf.published || false,
      description: wf.description,
      credits: wf.credits || 0,
      category: wf.category,
      price: wf.price,
      rating: wf.rating,
      reviews: wf.reviews,
      coverImage: wf.coverImage,
      features: wf.features,
      authorName: wf.authorName,
      authorAvatar: wf.authorAvatar,
    })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb();
    const userId = req.headers.get('user-id') || 'demo-user';
    const body = await req.json();
    const { id, published, description, credits, category, price, coverImage, features, authorName, authorAvatar } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing workflow ID' }, { status: 400 });
    }
    
    const updateData: any = {};
    if (published !== undefined) updateData.published = published;
    if (description !== undefined) updateData.description = description;
    if (credits !== undefined) updateData.credits = parseInt(credits) || 0;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (features !== undefined) updateData.features = features;
    if (authorName !== undefined) updateData.authorName = authorName;
    if (authorAvatar !== undefined) updateData.authorAvatar = authorAvatar;
    
    const result = await db.collection('workflows').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, updated: result.modifiedCount > 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 