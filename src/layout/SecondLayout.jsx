import Header from '@containers/Header';


export default function SecondLayout({ children }) {
  return (
    <>
      <div>
        <Header />
        <main>
          <div>{children}</div>
        </main>
      </div>
    </>
  );
}