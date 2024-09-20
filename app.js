const seriesContainer = document.getElementById('seriesContainer')
const detailContainer = document.getElementById('detailContainer')
const addSeriesBtn = document.getElementById('addSeriesBtn')
const moveButtons = document.querySelectorAll('.direction-buttons button')

let seriesCount = 0
let croppers = []

function createImageSeries() {
  seriesCount++
  const seriesId = `series${seriesCount}`
  const seriesHtml = `
    <div class="series-container" id="${seriesId}">
      <h3>Image Series ${seriesCount}</h3>
      <div class="thumbnail-container mb-3">
        ${Array(5)
          .fill()
          .map(
            (_, i) => `
            <img src="https://picsum.photos/200/300?random=${
              seriesCount * 10 + i
            }" class="thumbnail" alt="Image ${i + 1}" />
        `
          )
          .join('')}
      </div>
      <div class="image-container mb-3">
        <img id="selectedImage${seriesCount}" class="selected-image" src="https://picsum.photos/800/600?random=${
    seriesCount * 10
  }" alt="Selected Image" />
        <button class="prevBtn btn btn-primary nav-button">&lt;</button>
        <button class="nextBtn btn btn-primary nav-button">&gt;</button>
      </div>
    </div>
  `
  seriesContainer.insertAdjacentHTML('beforeend', seriesHtml)

  const detailHtml = `
    <div class="detail-container" data-series="${seriesCount}">
      <div class="drag-handle">
        <span>Detail View ${seriesCount}</span>
        <div class="height-controls">
          <button class="btn btn-sm btn-outline-secondary decrease-height">-</button>
          <button class="btn btn-sm btn-outline-secondary increase-height">+</button>
        </div>
      </div>
      <div class="detailCanvas" id="detailCanvas${seriesCount}"></div>
      <div class="resize-handle"></div>
    </div>
  `
  detailContainer.insertAdjacentHTML('beforeend', detailHtml)

  initSeriesListeners(seriesId)
  initCropper(seriesCount)
  initDetailViewControls(seriesCount)
  initDragAndDrop()
}

function initSeriesListeners(seriesId) {
  const series = document.getElementById(seriesId)
  const thumbnails = series.querySelectorAll('.thumbnail')
  const selectedImage = series.querySelector('.selected-image')
  const prevBtn = series.querySelector('.prevBtn')
  const nextBtn = series.querySelector('.nextBtn')

  let currentIndex = 0

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      selectedImage.src = thumb.src
      currentIndex = index
      updateThumbnailSelection(thumbnails, currentIndex)
      initCropper(seriesCount)
    })
  })

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length
    selectedImage.src = thumbnails[currentIndex].src
    updateThumbnailSelection(thumbnails, currentIndex)
    initCropper(seriesCount)
  })

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % thumbnails.length
    selectedImage.src = thumbnails[currentIndex].src
    updateThumbnailSelection(thumbnails, currentIndex)
    initCropper(seriesCount)
  })
}

function updateThumbnailSelection(thumbnails, currentIndex) {
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('selected', index === currentIndex)
  })
}

function initCropper(seriesIndex) {
  const selectedImage = document.getElementById(`selectedImage${seriesIndex}`)
  const detailCanvas = document.getElementById(`detailCanvas${seriesIndex}`)

  if (croppers[seriesIndex - 1]) {
    croppers[seriesIndex - 1].destroy()
  }

  croppers[seriesIndex - 1] = new Cropper(selectedImage, {
    viewMode: 1,
    dragMode: 'move',
    aspectRatio: NaN,
    autoCropArea: 1,
    restore: false,
    guides: false,
    center: false,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    ready: function () {
      updateDetailView(seriesIndex)
    },
    crop: function () {
      updateDetailView(seriesIndex)
    },
  })
}

function updateDetailView(seriesIndex) {
  const detailCanvas = document.getElementById(`detailCanvas${seriesIndex}`)
  const detailImage = croppers[seriesIndex - 1].getCroppedCanvas().toDataURL()
  detailCanvas.innerHTML = `<img src="${detailImage}" alt="Detail Image ${seriesIndex}">`
}

function initDetailViewControls(seriesIndex) {
  const detailView = document.querySelector(
    `.detail-container[data-series="${seriesIndex}"]`
  )
  const resizeHandle = detailView.querySelector('.resize-handle')
  const dragHandle = detailView.querySelector('.drag-handle')
  const increaseBtn = detailView.querySelector('.increase-height')
  const decreaseBtn = detailView.querySelector('.decrease-height')

  let startY, startHeight

  resizeHandle.addEventListener('mousedown', initResize)

  function initResize(e) {
    startY = e.clientY
    startHeight = parseInt(
      document.defaultView.getComputedStyle(detailView).height,
      10
    )
    document.documentElement.addEventListener('mousemove', resize)
    document.documentElement.addEventListener('mouseup', stopResize)
  }

  function resize(e) {
    const newHeight = startHeight + e.clientY - startY
    detailView.style.height = newHeight + 'px'
    updateDetailView(seriesIndex)
  }

  function stopResize() {
    document.documentElement.removeEventListener('mousemove', resize)
    document.documentElement.removeEventListener('mouseup', stopResize)
  }

  dragHandle.addEventListener('mousedown', initDrag)

  function initDrag(e) {
    e.preventDefault()
    document.documentElement.addEventListener('mousemove', drag)
    document.documentElement.addEventListener('mouseup', stopDrag)
  }

  function drag(e) {
    const detailContainer = document.getElementById('detailContainer')
    const draggingElement = detailView
    const draggingRect = draggingElement.getBoundingClientRect()
    const containerRect = detailContainer.getBoundingClientRect()

    const mouseY = e.clientY - containerRect.top
    const elementCenter = draggingRect.height / 2

    let newIndex = 0
    const detailViews = Array.from(detailContainer.children)

    for (let i = 0; i < detailViews.length; i++) {
      const viewRect = detailViews[i].getBoundingClientRect()
      const viewCenter = viewRect.top - containerRect.top + viewRect.height / 2

      if (mouseY > viewCenter) {
        newIndex = i + 1
      } else {
        break
      }
    }

    if (newIndex !== detailViews.indexOf(draggingElement)) {
      detailContainer.insertBefore(draggingElement, detailViews[newIndex])
    }
  }

  function stopDrag() {
    document.documentElement.removeEventListener('mousemove', drag)
    document.documentElement.removeEventListener('mouseup', stopDrag)
  }

  increaseBtn.addEventListener('click', () => changeHeight(20))
  decreaseBtn.addEventListener('click', () => changeHeight(-20))

  function changeHeight(delta) {
    const currentHeight = parseInt(
      document.defaultView.getComputedStyle(detailView).height,
      10
    )
    detailView.style.height = currentHeight + delta + 'px'
    updateDetailView(seriesIndex)
  }
}

function initDragAndDrop() {
  new Sortable(detailContainer, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: function (evt) {
      const detailViews = Array.from(detailContainer.children)
      croppers = detailViews.map((view) => {
        const seriesIndex = parseInt(view.dataset.series)
        return croppers[seriesIndex - 1]
      })
    },
  })
}
moveButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const direction = btn.textContent
    const move = 10
    croppers.forEach((cropper) => {
      switch (direction) {
        case '↑':
          cropper.move(0, -move)
          break
        case '↓':
          cropper.move(0, move)
          break
        case '←':
          cropper.move(-move, 0)
          break
        case '→':
          cropper.move(move, 0)
          break
      }
    })
    croppers.forEach((_, index) => updateDetailView(index + 1))
  })
})

addSeriesBtn.addEventListener('click', createImageSeries)

// Initialize with one series
createImageSeries()
