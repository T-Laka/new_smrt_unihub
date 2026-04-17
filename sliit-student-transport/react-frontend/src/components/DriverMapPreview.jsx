import { featuredDrivers } from '../data/siteData';

const markerPositions = [
  { left: '18%', top: '28%' },
  { left: '68%', top: '22%' },
  { left: '34%', top: '64%' },
  { left: '76%', top: '58%' }
];

export default function DriverMapPreview() {
  return (
    <div className="map-card surface">
      <div className="map-visual">
        <div className="map-grid-lines" />
        <div className="map-campus-marker">SLIIT Malabe</div>
        {featuredDrivers.map((driver, index) => (
          <div
            key={driver.name}
            className="map-pin"
            style={{
              ...markerPositions[index],
              background: driver.color
            }}
            title={driver.name}
          >
            {driver.name.split(' ')[0]}
          </div>
        ))}
      </div>

      <div className="map-legend">
        <div>
          <strong>Map preview</strong>
          <p>Sample drivers near SLIIT Malabe Campus</p>
        </div>

        <div className="legend-list">
          <span><i className="legend-dot driver" /> Nearby drivers</span>
          <span><i className="legend-dot campus" /> Campus marker</span>
        </div>
      </div>
    </div>
  );
}