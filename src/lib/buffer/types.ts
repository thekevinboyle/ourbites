export interface BufferConfig {
  apiToken: string;
  organizationId: string;
}

export interface BufferChannel {
  id: string;
  service: string;
  name: string;
  avatar?: string;
}

export interface BufferCreatePostInput {
  channelId: string;
  text: string;
  schedulingType: "automatic" | "notification";
  mode: "addToQueue" | "shareNow" | "shareNext" | "customScheduled" | "recommendedTime";
  dueAt?: string;
  isDraft?: boolean;
}

export interface BufferPost {
  id: string;
  text: string;
  status: string;
  dueAt: string | null;
  channelId: string;
  type?: string;
}

export interface BufferPostActionSuccess {
  post: BufferPost;
}

export interface BufferMutationError {
  message: string;
}

export type BufferCreatePostResult =
  | { __typename: "PostActionSuccess"; post: BufferPost }
  | { __typename: "MutationError"; message: string };
