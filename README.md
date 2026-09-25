# Eras Concert Simulator (fan project)

Simulador de concierto en Three.js con arquitectura preparada para multijugador.

## Ejecutar
    npm install
    npm run dev

## Controles
- WASD mover · Shift correr · Espacio saltar
- E saludar · Q corazones
- 1-8 eras · F fuegos · C cambiar cámara · Esc soltar ratón

## Pasar a multijugador
1. cd server && npm install && npm start
2. En src/main.js cambia OfflineAdapter por WebSocketAdapter(bus, 'ws://localhost:8080')

## Aviso
Proyecto fan no oficial. Usa solo música que tengas derecho a reproducir.