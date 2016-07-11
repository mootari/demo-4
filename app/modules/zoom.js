import {zoom as d3zoom, event as d3event, zoomIdentity as d3zoomIdentity} from 'd3';

export default function(eventSelection, zoomSelection) {
  const zoom = d3zoom();
  zoom.on('zoom.drawBox', () => { zoomSelection.attr('transform', d3event.transform); });
  eventSelection.call(zoom);

  return {
    center: () => {
      zoom.translateBy(eventSelection, window.innerWidth / 2, window.innerHeight / 2);
    },
    // Adjusts scale and translation to the first element in the selection.
    fit: (selection, scaleModifier = .9) => {
      const box = selection.node().getBBox();
      const scale = Math.min(window.innerWidth / box.width, window.innerHeight / box.height) * scaleModifier;

      // Reset transform.
      let transform = d3zoomIdentity;
      // Center [0, 0].
      transform = transform.translate(window.innerWidth / 2, window.innerHeight / 2);
      // Apply scale.
      transform = transform.scale(scale);
      // Center elements.
      transform = transform.translate(-box.x - box.width / 2, -box.y - box.height / 2);
      zoom.transform(eventSelection, transform);
    },
    on: zoom.on
  };
}
