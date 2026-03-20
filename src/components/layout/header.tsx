export function Header({ title }: { title: string }) {
  return (
    <header className="border-b-4 border-primary py-8 px-6">
      <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight">
        {title}
      </h2>
    </header>
  );
}
