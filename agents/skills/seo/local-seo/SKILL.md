---
name: openseo-local-seo
description: Audita la visibilidad en Google Maps, perfiles de Google Business y rankings del Local Pack geolocalizados mediante OpenSEO MCP.
---

# Skill: OpenSEO Local SEO & Google Business Auditing

## Objetivo y Contexto
Analizar la presencia y posicionamiento geolocalizado en Google Maps y el paquete local (*Local 3-Pack*) para entidades, marcas o proyectos que cuenten con ficha física o área de servicio regional.

---

## 🛠️ Herramientas MCP

- `search_local_businesses`: Búsqueda de fichas locales cercanas, estado de verificación/reclamación (`isClaimed`), valoraciones y categorías.
- `get_local_serp_results`: Resultados del Local Finder y Maps alrededor de coordenadas geográficas específicas.
- `get_business_profile`: Detalle completo del perfil de empresa (horarios, categorías secundarias, desglose de reseñas).
- `get_business_reviews`: Extracción y análisis de reseñas recientes y tasa de respuesta del propietario.
- `get_local_rank_grid`: Malla de posicionamiento geográfico por cuadrícula (3x3 o 5x5) para ver el radio real de visibilidad.

---

## 🔄 Flujo de Trabajo

1. **Localizar la Entidad/Ficha:** Extraer `cid` o `placeId` mediante `search_local_businesses`.
2. **Comparar contra Competidores Locales:** Analizar categorías principales/secundarias, volumen de reseñas y completitud del perfil.
3. **Comprobar Enlace Web:** Verificar que el enlace en la ficha apunte a una URL web rápida, con canonicals correctos y Schema `LocalBusiness` o `ProfessionalService` válido.
4. **Evaluar Malla de Cobertura:** Usar `get_local_rank_grid` para identificar dónde decae la visibilidad respecto a la competencia.
5. **Emitir Recomendaciones de Acción:** Centradas en categorías exactas, higiene de reseñas y optimización de la página de aterrizaje web vinculada.
