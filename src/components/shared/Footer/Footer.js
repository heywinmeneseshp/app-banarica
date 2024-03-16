import Link from "next/link";

// Footer.js
function Footer() {
  return (
    <footer className="bg-dark text-white py-4">
      <div className="container text-center">
        <p className="mb-1">
          © {new Date().getFullYear()} Craken. Todos los derechos reservados.
        </p>
        <p className="mb-2">
          Contacto: <Link href="tel:+573226737763">+57 322 6737763</Link> |{" "}
          <Link href="mailto:meneses@craken.com.co">meneses@craken.com.co</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
