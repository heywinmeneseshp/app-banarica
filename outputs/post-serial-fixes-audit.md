# Post-audit de serial_de_articulos

- Fecha: 2026-05-12T18:47:04.919Z
- Base evaluada: `joeyropa_prueba_banarica`

## Resumen

```json
[
  {
    "orphan_motivo_rows": 0,
    "orphan_user_rows": 0,
    "remaining_ex_rows": 0,
    "null_cons_movimiento_rows": 13320
  }
]
```

## Motivos mapeados

```json
[
  {
    "consecutivo": "INSP01",
    "total": 77225
  },
  {
    "consecutivo": "INSP02",
    "total": 6061
  }
]
```

## Usuarios mas presentes por ID valido

```json
[
  {
    "username": "ydelavega",
    "total": 68255
  },
  {
    "username": "admin",
    "total": 8234
  },
  {
    "username": "ybello",
    "total": 530
  },
  {
    "username": "AndresPardo",
    "total": 528
  },
  {
    "username": "luismejia",
    "total": 332
  },
  {
    "username": "ibarra",
    "total": 320
  },
  {
    "username": "dvanegas",
    "total": 316
  },
  {
    "username": "rodnyb",
    "total": 279
  },
  {
    "username": "ivanpolo",
    "total": 196
  },
  {
    "username": "dmuniz",
    "total": 84
  }
]
```

## Muestras pendientes de motivo invalido

```json
[]
```

## Muestras pendientes de usuario invalido

```json
[]
```

## Muestras de registros aun con EX

```json
[]
```

## Lectura esperada

- Si corriste solo `serial-de-articulos-safe-fixes.sql`, lo esperado es:
  - `orphan_motivo_rows = 0`
  - `orphan_user_rows = 0`
  - `remaining_ex_rows = 2118`
- Si ademas corriste `serial-ex-nullify.sql`, entonces tambien deberia quedar `remaining_ex_rows = 0`.
