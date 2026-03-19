import type {
  BufferConfig,
  BufferChannel,
  BufferPost,
  BufferCreatePostInput,
} from "./types";

const BUFFER_API_URL = "https://api.buffer.com";

export class BufferClient {
  private config: BufferConfig;

  constructor(config: BufferConfig) {
    this.config = config;
  }

  private async query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Buffer API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (result.errors?.length) {
      throw new Error(`Buffer GraphQL error: ${result.errors[0].message}`);
    }
    return result.data as T;
  }

  async getChannels(): Promise<BufferChannel[]> {
    const data = await this.query<{ channels: BufferChannel[] }>(`
      query GetChannels($orgId: String!) {
        channels(input: { organizationId: $orgId }) {
          id
          service
          name
          avatar
        }
      }
    `, { orgId: this.config.organizationId });
    return data.channels;
  }

  async schedulePost(input: BufferCreatePostInput): Promise<BufferPost> {
    const data = await this.query<{ createPost: { post?: BufferPost; message?: string } }>(`
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post {
              id
              text
              status
              dueAt
              channelId
            }
          }
          ... on MutationError {
            message
          }
        }
      }
    `, { input });

    if (data.createPost.message) {
      throw new Error(data.createPost.message);
    }
    if (!data.createPost.post) {
      throw new Error("No post returned from Buffer");
    }
    return data.createPost.post;
  }

  async getPosts(status: string, channelIds?: string[]): Promise<BufferPost[]> {
    const data = await this.query<{ posts: { edges: { node: BufferPost }[] } }>(`
      query GetPosts($orgId: String!, $status: PostStatus!, $channelIds: [String!]) {
        posts(input: {
          organizationId: $orgId,
          status: $status,
          channelIds: $channelIds
        }, first: 100) {
          edges {
            node {
              id
              text
              status
              dueAt
              channelId
            }
          }
        }
      }
    `, {
      orgId: this.config.organizationId,
      status,
      channelIds,
    });
    return data.posts.edges.map((e) => e.node);
  }

  async deletePost(postId: string): Promise<void> {
    const data = await this.query<{ deletePost: { post?: { id: string }; message?: string } }>(`
      mutation DeletePost($input: DeletePostInput!) {
        deletePost(input: $input) {
          ... on PostActionSuccess {
            post { id }
          }
          ... on MutationError {
            message
          }
        }
      }
    `, { input: { postId } });

    if (data.deletePost.message) {
      throw new Error(data.deletePost.message);
    }
  }
}

export function isBufferConfigured(): boolean {
  return !!(process.env.BUFFER_API_TOKEN && process.env.BUFFER_ORGANIZATION_ID);
}

export function createBufferClient(): BufferClient | null {
  if (!isBufferConfigured()) return null;
  return new BufferClient({
    apiToken: process.env.BUFFER_API_TOKEN!,
    organizationId: process.env.BUFFER_ORGANIZATION_ID!,
  });
}
