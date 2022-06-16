import Head from 'next/head'

//Components
import Inicio from '@containers/Inicio';
import SecondLayout from 'layout/SecondLayout';


//CSS

export default function Home() {
  return (
    <div>
      <Head>
        <title>Banarica</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SecondLayout>
        <Inicio />
      </SecondLayout>

    </div>
  )
}
