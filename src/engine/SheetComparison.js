import { buildAngularResponse } from './AngularResponse.js'
import { projectCylindricalColumns } from './OpticalSimulation.js'

export function compareSheetProfiles({ rasterWidth, previewWidth, settings, viewCount, angleDeg, opticsA, opticsB }) {
  function projectSheet(profile) {
    const columns = projectCylindricalColumns({ rasterWidth, previewWidth, settings, angleDeg, profile })
    const [{ shares }] = buildAngularResponse({
      rasterWidth, settings, viewCount, angles: [angleDeg], project: () => columns,
    })
    return { columns, shares }
  }

  return { a: projectSheet(opticsA), b: projectSheet(opticsB) }
}
