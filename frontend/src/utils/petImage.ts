import pibble from '../assets/pets/pibble.png'
import pibble2 from '../assets/pets/pibble2.png'
import pibble3 from '../assets/pets/pibble3.png'
import pibble4 from '../assets/pets/pibble4.png'
import pibble5 from '../assets/pets/pibble5.png'

/**
 * Get the pet image based on health percentage
 * @param health Current health value
 * @param maxHealth Maximum health value
 * @returns Image source for the appropriate pet state
 */
export function getPetImage(health: number, maxHealth: number): string {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100))
  
  if (healthPercent >= 80) {
    return pibble // Healthiest
  } else if (healthPercent >= 60) {
    return pibble2 // High health
  } else if (healthPercent >= 40) {
    return pibble3 // Medium health
  } else if (healthPercent >= 20) {
    return pibble4 // Low health
  } else {
    return pibble5 // Lowest health (critical)
  }
}
