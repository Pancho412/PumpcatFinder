// Agradecimientos especiales (popup "Acerca de").
// Cada grupo tiene un encabezado y sus personas:
//   title  = encabezado del grupo en inglés (en) y español (es)
//   style  = "title" (grande) o "subtitle" (más pequeño)
//   people = lista de personas:
//     name  = nombre visible bajo la foto (no se traduce)
//     image = ruta de la foto, ej: "img/credits/nombre.png" (cuadrada se ve mejor; se recorta en círculo).
//             Si queda "", se muestra un círculo con la inicial del nombre.
//     link  = enlace opcional al hacer clic (perfil, canal, etc.); "" si no hay
// Se muestran hasta 4 personas por fila, centradas.
const credits_groups = [
    {
        "title": { "en": "People who contributed to the Drive", "es": "Gente que contribuyó al Drive" },
        "style": "title",
        "people": [
            { "name": "[Ttar] Phoebe", "image": "img/credits/Phoebe.png" },
            { "name": "[Méw] BlueQuilava", "image": "img/credits/Blue.png" },
            { "name": "[Urmo] Cassandra", "image": "img/credits/Cassandra.png" },
            { "name": "[Ttar] Lowkey", "image": "img/credits/Lowkey.png" }
        ]
    },
    {
        "title": { "en": "Developed by", "es": "Desarrollado por" },
        "style": "subtitle",
        "people": [
            { "name": "[MeD] Pancho", "image": "img/credits/Pancho.png"}
        ]
    }
];
