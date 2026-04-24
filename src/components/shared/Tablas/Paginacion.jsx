import React from "react";

//Bootstrap
import { Pagination } from 'react-bootstrap';

const Paginacion = ({ setPagination, pagination, total, limit }) => {
  
    let totales = Math.ceil(total/limit);

    const handleBotonPagionation = (number, pagination, setPagination) => {
        if (pagination > 0) setPagination(pagination + number);
        if (number == 0) setPagination(1);
        if (number.tamanho) setPagination(number.tamanho);
    };
    return (
        <>
            <div className="d-flex justify-content-center align-items-center mt-3 overflow-auto">
                <Pagination className="mb-0 flex-wrap justify-content-center">
                    <Pagination.First onClick={() => handleBotonPagionation(0, pagination, setPagination)} />
                    {(pagination > 1) && <Pagination.Prev onClick={() => handleBotonPagionation(-1, pagination, setPagination)} />}
                    {(pagination > 3) && <Pagination.Item onClick={() => handleBotonPagionation(-2, pagination, setPagination)}>{pagination - 2}</Pagination.Item>}

                    {(pagination > 1) && <Pagination.Item onClick={() => handleBotonPagionation(-1, pagination, setPagination)}>{pagination - 1}</Pagination.Item>}
                    <Pagination.Item disabled>{pagination}</Pagination.Item>
                    {(pagination < totales) && <Pagination.Item onClick={() => handleBotonPagionation(1, pagination, setPagination)}>{pagination + 1}</Pagination.Item>}
                    {(pagination < totales - 1) && <Pagination.Item onClick={() => handleBotonPagionation(2, pagination, setPagination)}>{pagination + 2}</Pagination.Item>}

                    {(pagination < totales) && <Pagination.Next onClick={() => handleBotonPagionation(1, pagination, setPagination)} />}
                    <Pagination.Last onClick={() => handleBotonPagionation({ tamanho: totales }, pagination, setPagination)} />
                </Pagination>
            </div>
        </>
    );
};

export default Paginacion;
