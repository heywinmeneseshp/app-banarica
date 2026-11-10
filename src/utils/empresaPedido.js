// Datos de la comercializadora que firma el pedido segun el almacen (los consecutivos de almacen
// terminan en BC para Banachica). Misma regla que el documento de pedido del modulo de Almacen.
export function datosComercializadora(consAlmacen = '') {
    const esBanachica = String(consAlmacen).slice(-2) === 'BC';
    return {
        esBanachica,
        comercializadora: esBanachica ? 'C.I. BANACHICA S.A.S. ZOMAC.' : 'C.I. Bana Rica S.A.',
        direccion: esBanachica ? 'Cra 5 5 44 AP 03, Aracataca, Magdalena' : 'Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia',
        tel: esBanachica ? 'Cel: 3116348058 - Tel: 4372003' : 'Tel: (604) 480 5034 - (604) 4805022',
        correo: esBanachica ? 'facturacionbanachica@gmail.com' : 'www.banarica.com - facturacion@banarica.com',
    };
}
