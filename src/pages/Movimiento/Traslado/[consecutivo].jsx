import React, { useEffect} from "react";
import { useRouter } from "next/router";
import RecibirTraslado from "@components/almacen/RecibirTraslado";
import ThirdLayout from 'layout/ThirdLayout';

export default function RTraslado() {
    const router = useRouter()

    useEffect(()=>{
    
    },[router.isReady])
    return (
        <ThirdLayout>
            <RecibirTraslado movimiento={router.query}/>
        </ThirdLayout>
    );
}
