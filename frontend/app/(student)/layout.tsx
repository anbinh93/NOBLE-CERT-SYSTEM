
export default function StudentRootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-background">
          {children}
      </div>
    );
  }
