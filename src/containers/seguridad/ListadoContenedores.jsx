import { useState } from 'react';

const ListadoContenedores = () => {
  const [tableData, setTableData] = useState([
    { id: 1, "Contenedor": 'Item 1', quantity: 10 },
    { id: 2, "Contenedor": 'Item 2', quantity: 15 },
    // Agrega más filas según sea necesario
  ]);

  const handleCellEdit = (id, field, value) => {
    const updatedData = tableData.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  return (

    
    <table className="table table-striped-columns">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Sem</th>
          <th>Booking</th>
          <th>Destino</th>
          <th>Finca</th>
          <th>Contenedor</th>
          <th>Botella</th>
          <th>Termografo</th>
          <th>Producto</th>
          <th>Cajas</th>
          <th>Pallets</th>
          <th>Peso Bruto</th>
          <th>Peso Neto</th>
        </tr>
      </thead>
      <tbody>
        {tableData.map(row => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td contentEditable onBlur={(e) => handleCellEdit(row.id, "Contenedor", e.target.innerText)}>{row.name}</td>
            <td contentEditable onBlur={(e) => handleCellEdit(row.id, 'quantity', parseInt(e.target.innerText))}>{row.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ListadoContenedores;