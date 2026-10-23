import React, { useEffect, useRef } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FaBold, FaItalic, FaLink, FaListUl, FaRemoveFormat, FaUnderline } from 'react-icons/fa';

const COLORES = [
  { nombre: 'Negro', valor: '#111827' },
  { nombre: 'Verde', valor: '#166534' },
  { nombre: 'Rojo', valor: '#b91c1c' },
  { nombre: 'Azul', valor: '#1d4ed8' },
  { nombre: 'Gris', valor: '#6b7280' },
];

// Editor de texto con barra de formato (negrita, cursiva, subrayado, color,
// lista y enlace). Entrega el contenido como HTML por onChange(html, texto);
// el backend vuelve a limpiar ese HTML (lista blanca) antes de enviarlo.
// Es "no controlado": el contenido inicial se carga una vez y para vaciarlo se
// cambia la prop `reinicio`.
export default function EditorMensaje({ onChange, maxTexto = 5000, reinicio = 0, placeholder = '' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = '';
  }, [reinicio]);

  const emitir = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange?.(el.innerHTML, el.innerText || '');
  };

  // Los botones no le quitan el foco al editor, asi se conserva la seleccion.
  const comando = (nombre, valor = null) => (event) => {
    event.preventDefault();
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(nombre, false, valor);
    emitir();
  };

  const insertarEnlace = (event) => {
    event.preventDefault();
    const url = window.prompt('Direccion del enlace (https://...)');
    if (!url) return;
    if (!/^(https?:\/\/|mailto:)/i.test(url.trim())) {
      window.alert('El enlace debe empezar por http://, https:// o mailto:');
      return;
    }
    editorRef.current?.focus();
    document.execCommand('createLink', false, url.trim());
    emitir();
  };

  // Pega solo texto plano: evita traer estilos raros desde Word o la web.
  const pegarTexto = (event) => {
    event.preventDefault();
    const texto = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, texto);
  };

  return (
    <div className="border rounded">
      <style>{`.editor-mensaje:empty::before { content: attr(data-placeholder); color: #9ca3af; }`}</style>
      <div className="d-flex flex-wrap align-items-center gap-2 border-bottom p-1 bg-light">
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" title="Negrita" onMouseDown={comando('bold')}><FaBold /></Button>
          <Button variant="outline-secondary" title="Cursiva" onMouseDown={comando('italic')}><FaItalic /></Button>
          <Button variant="outline-secondary" title="Subrayado" onMouseDown={comando('underline')}><FaUnderline /></Button>
        </ButtonGroup>
        <div className="d-flex align-items-center gap-1" title="Color del texto seleccionado">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              type="button"
              className="border rounded-circle"
              style={{ width: 20, height: 20, backgroundColor: c.valor, padding: 0 }}
              title={c.nombre}
              aria-label={`Color ${c.nombre}`}
              onMouseDown={comando('foreColor', c.valor)}
            />
          ))}
        </div>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" title="Lista con vinetas" onMouseDown={comando('insertUnorderedList')}><FaListUl /></Button>
          <Button variant="outline-secondary" title="Insertar enlace" onMouseDown={insertarEnlace}><FaLink /></Button>
          <Button variant="outline-secondary" title="Quitar formato" onMouseDown={comando('removeFormat')}><FaRemoveFormat /></Button>
        </ButtonGroup>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Mensaje"
        data-placeholder={placeholder}
        className="p-2 editor-mensaje"
        style={{ minHeight: 160, maxHeight: 360, overflowY: 'auto', outline: 'none', whiteSpace: 'pre-wrap' }}
        onInput={(event) => {
          const el = event.currentTarget;
          if ((el.innerText || '').length > maxTexto) {
            document.execCommand('undo');
          }
          emitir();
        }}
        onPaste={pegarTexto}
        onBlur={emitir}
      />
    </div>
  );
}
