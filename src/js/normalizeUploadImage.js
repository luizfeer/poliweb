const MAX_IMAGE_DIMENSION = 4096
const JPEG_QUALITY = 0.92

function isJpeg(file) {
  return file?.type === 'image/jpeg' || /\.jpe?g$/i.test(file?.name || '')
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob
        ? resolve(blob)
        : reject(new Error('Não foi possível converter a foto para JPEG.')),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Safari antigo pode não aceitar as opções; o elemento img é o fallback.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Regrava JPEGs para remover estruturas inválidas que alguns celulares produzem
 * e que o libvips rejeita (por exemplo, parâmetros SOS inválidos).
 */
export async function normalizeUploadImage(file) {
  if (!isJpeg(file)) return file

  let image
  try {
    image = await decodeImage(file)
    const sourceWidth = image.width || image.naturalWidth
    const sourceHeight = image.height || image.naturalHeight

    if (!sourceWidth || !sourceHeight) {
      throw new Error('Dimensões da foto inválidas.')
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a foto.')

    context.drawImage(image, 0, 0, width, height)
    const blob = await canvasToJpeg(canvas)

    return new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    })
  } catch (error) {
    const normalizedError = new Error(
      'Esta foto não pôde ser processada. Tente editá-la ou salvá-la novamente na galeria.'
    )
    normalizedError.cause = error
    throw normalizedError
  } finally {
    if (typeof image?.close === 'function') image.close()
  }
}
