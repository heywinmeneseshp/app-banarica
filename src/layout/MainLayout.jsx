export default function MainLayout({ children }) {
    return (
      <>
        <div className="min-h-full">
          <main>
            <div>{children}</div>
          </main>
        </div>
      </>
    );
  }
  