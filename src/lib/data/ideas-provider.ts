import { supabase } from "../supabase";
import type { Idea, IdeaImage, CreateIdeaInput, UpdateIdeaInput } from "./types";

function mapImage(row: Record<string, unknown>): IdeaImage {
  const storagePath = row.storage_path as string;
  const { data } = supabase.storage.from("idea-images").getPublicUrl(storagePath);
  return {
    id: row.id as string,
    storagePath,
    fileName: row.file_name as string,
    url: data.publicUrl,
  };
}

function mapIdea(row: Record<string, unknown>, images: IdeaImage[] = []): Idea {
  return {
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    content: (row.content as string | null) ?? null,
    links: (row.links as string[]) ?? [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    convertedTo: (row.converted_to as string | null) ?? null,
    images,
  };
}

export async function getIdeas(): Promise<Idea[]> {
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const ideaIds = (ideas ?? []).map((i) => i.id);

  const imagesByIdea = new Map<string, IdeaImage[]>();

  if (ideaIds.length > 0) {
    const { data: imageRows, error: imgError } = await supabase
      .from("idea_images")
      .select("*")
      .in("idea_id", ideaIds);

    if (imgError) throw new Error(imgError.message);

    for (const row of imageRows ?? []) {
      const ideaId = row.idea_id;
      const image = mapImage(row as Record<string, unknown>);
      const existing = imagesByIdea.get(ideaId) ?? [];
      existing.push(image);
      imagesByIdea.set(ideaId, existing);
    }
  }

  return (ideas ?? []).map((idea) =>
    mapIdea(idea as Record<string, unknown>, imagesByIdea.get(idea.id) ?? [])
  );
}

export async function getIdea(id: string): Promise<Idea> {
  const { data: idea, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const { data: imageRows, error: imgError } = await supabase
    .from("idea_images")
    .select("*")
    .eq("idea_id", id);

  if (imgError) throw new Error(imgError.message);

  const images = (imageRows ?? []).map((row) => mapImage(row as Record<string, unknown>));

  return mapIdea(idea as Record<string, unknown>, images);
}

export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
  const { data, error } = await supabase
    .from("ideas")
    .insert({
      title: input.title ?? null,
      content: input.content ?? null,
      links: input.links ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return mapIdea(data as Record<string, unknown>, []);
}

export async function updateIdea(id: string, input: UpdateIdeaInput): Promise<Idea> {
  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.links !== undefined) updateData.links = input.links;

  const { data, error } = await supabase
    .from("ideas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Re-fetch images for the updated idea
  const { data: imageRows, error: imgError } = await supabase
    .from("idea_images")
    .select("*")
    .eq("idea_id", id);

  if (imgError) throw new Error(imgError.message);

  const images = (imageRows ?? []).map((row) => mapImage(row as Record<string, unknown>));

  return mapIdea(data as Record<string, unknown>, images);
}

export async function deleteIdea(id: string): Promise<void> {
  // First, get all images so we can delete them from storage
  const { data: imageRows } = await supabase
    .from("idea_images")
    .select("storage_path")
    .eq("idea_id", id);

  const storagePaths = (imageRows ?? []).map((row) => row.storage_path);

  if (storagePaths.length > 0) {
    await supabase.storage.from("idea-images").remove(storagePaths);
  }

  // Cascade delete removes idea_images rows automatically
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function convertIdea(ideaId: string, postId: string): Promise<Idea> {
  const { data, error } = await supabase
    .from("ideas")
    .update({ converted_to: postId })
    .eq("id", ideaId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: imageRows, error: imgError } = await supabase
    .from("idea_images")
    .select("*")
    .eq("idea_id", ideaId);

  if (imgError) throw new Error(imgError.message);

  const images = (imageRows ?? []).map((row) => mapImage(row as Record<string, unknown>));

  return mapIdea(data as Record<string, unknown>, images);
}

export async function uploadIdeaImage(ideaId: string, file: File): Promise<IdeaImage> {
  const storagePath = `${ideaId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("idea-images")
    .upload(storagePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("idea_images")
    .insert({
      idea_id: ideaId,
      storage_path: storagePath,
      file_name: file.name,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return mapImage(data as Record<string, unknown>);
}

export async function deleteIdeaImage(imageId: string, storagePath: string): Promise<void> {
  await supabase.storage.from("idea-images").remove([storagePath]);

  const { error } = await supabase.from("idea_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
}
