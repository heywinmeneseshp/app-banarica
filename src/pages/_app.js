import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppContext from '../context/AppContext';

function MyApp({ Component, pageProps }) {
  return (
    <AppContext.Provider value={"aca paso datos"}>
      
      <Component {...pageProps} />
    </AppContext.Provider>
  )
}

export default MyApp
