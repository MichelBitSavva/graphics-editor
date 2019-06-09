const wrap = document.querySelector('.wrap');
const app = document.querySelector('.app');
const body = document.querySelector('body');
const menu = document.querySelector('.menu');
const img = document.querySelector('.current-image');
const mask = document.querySelector('.mask');
const newPic = document.querySelector('.new');
const pictureDiv = document.querySelector('.picture');

document.addEventListener('DOMContentLoaded', function () {
  const imgID = getIdFromUrl('id');
  if (imgID) {
    window.imgID = imgID;
    wsConnect();
  };
});

function getIdFromUrl(name) {
  const imgHref = window.location.search.split('?id=')[1];
  return imgHref;
};

// Расположение блока меню
menu.setAttribute('draggable', true);
menu.addEventListener('mousedown', event => {
  if (event.which != 1) {
    return;
  };
  const elem = event.target.closest('.drag');
  if (!elem) return;
  const coords = getCoords(menu);
  const shiftX = event.pageX - coords.left;
  const shiftY = event.pageY - coords.top;
  const limits = {
    top: wrap.offsetTop + shiftY,
    right: wrap.offsetWidth + wrap.offsetLeft - menu.offsetWidth + shiftX,
    bottom: wrap.offsetHeight + wrap.offsetTop - menu.offsetHeight + shiftY,
    left: wrap.offsetLeft + shiftX
  };

  function moveAt(event) {
    const newLocation = {
      x: limits.left,
      y: limits.top
    };
    if (event.pageX > limits.right) {
      newLocation.x = limits.right;
    } else if (event.pageX > limits.left) {
      newLocation.x = event.pageX;
    };
    if (event.pageY > limits.bottom) {
      newLocation.y = limits.bottom;
    } else if (event.pageY > limits.top) {
      newLocation.y = event.pageY;
    };
    menu.style.left = newLocation.x - shiftX + 'px';
    menu.style.top = newLocation.y - shiftY + 'px';
    menu.style.marginRight = '-1px';
  };

  document.onmousemove = function (event) {
    moveAt(event);
  };

  menu.onmouseup = function () {
    document.onmousemove = null;
    menu.onmouseup = null;
  };

  menu.ondragstart = function () {
    return false;
  };

  function getCoords(elem) {
    const box = elem.getBoundingClientRect();
    return {
      top: box.top + pageYOffset,
      left: box.left + pageXOffset
    };
  };
});

window.addEventListener("resize", windowResize, false);

function windowResize() {
  console.log('Resize event');
  resizePaintMask();
  relocationMenu();
};

function relocationMenu(position, value) {
  const limitPos = wrap.offsetLeft + wrap.offsetWidth - menu.offsetWidth - 1;
  if (parseInt(menu.style.left) < 0) {
    menu.style.left = '0px';
  } else {
    if (limitPos === parseInt(menu.style.left)) {
      menu.style.left = (parseInt(menu.style.left) - value) + 'px';
    } else if ((limitPos - value) < parseInt(menu.style.left)) {
      menu.style.left = (position - value) + 'px';
    };
  };
};

//Переключатель режимов
function setMode(mode) {
  app.className = "wrap";
  app.classList.add('app', 'app_' + mode);
}

//Загрузка и проверка изображений
const loadData = document.querySelector('input');
loadData.addEventListener('change', function (event) {
  const inputFilesArr = Array.from(this.files);
  const checkInput = inputFilesArr.forEach(function (elem) {
    if (elem.type == 'image/jpeg' || elem.type == 'image/png') {
      upload(inputFilesArr);
      errorMsg.classList.add('hidden');
    } else {
      errorMsg.classList.remove('hidden');
      errorMsg.style.zIndex = 10;
    };
  });
});

const imgLoader = document.querySelector('.image-loader');
const dropFiles = document.querySelector('body');
const errorMsg = document.querySelector('.error');
const repeatDownload = document.querySelector('.repeat-download');
dropFiles.addEventListener('drop', onFilesDrop);
dropFiles.addEventListener('dragover', event => event.preventDefault());
img.setAttribute('new', '');

function onFilesDrop(event) {
  event.preventDefault();
  const dropFilesArr = Array.from(event.dataTransfer.files);
  const checkDrop = dropFilesArr.forEach(function (elem) {
    console.log(`Загружаемый тип изображения: ${elem.type}`);
    if (elem.type == 'image/jpeg' || elem.type == 'image/png') {
      if (img.hasAttribute('new')) {
        upload(dropFilesArr);
        errorMsg.classList.add('hidden');
      } else {
        repeatDownload.classList.remove('hidden');
        repeatDownload.style.zIndex = 10;
      };
    } else {
      errorMsg.classList.remove('hidden');
      errorMsg.style.zIndex = 10;
    };
  });
};

function resetErrorMessage() {
  errorMsg.classList.add('hidden');
  repeatDownload.classList.add('hidden');
};

//Первичная загрузка на сервер
const serverError = document.querySelector('.server-error');

function upload(file) {
  const formData = new FormData();
  for (var i = 0, file; file = file[i]; ++i) {
    formData.append('title', file.name);
    formData.append('image', file);
  }
  imgLoader.classList.remove('hidden');
  repeatDownload.classList.add('hidden');
  serverError.classList.add('hidden');

  fetch('https://neto-api.herokuapp.com/pic', {
      method: 'POST',
      body: formData
})
    .then(response => {
      if (200 <= response.status && response.status < 300) {
        console.log(response);
        return response;
      }
      throw new Error(response.statusText);
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      mask.src = '';
      mask.classList.add('hidden');
      img.removeAttribute('new');
      serverError.classList.add('hidden');
      window.imgID = data.id;
      img.classList.remove('hidden');
      wsConnect();
    })
    .catch(error => {
      imgLoader.classList.add('hidden');
      serverError.classList.remove('hidden');
    });
};

//Режим "Основное меню"
const burger = document.querySelector('.burger');
burger.addEventListener('click', burgerModeReplace);

function burgerModeReplace(event) {
  const burgerPos = wrap.offsetLeft + wrap.offsetWidth - menu.offsetWidth - 1;
  if (getComputedStyle(comments).display === 'inline-block') {
    relocationMenu(burgerPos, 49);
  } else if (getComputedStyle(draw).display === 'inline-block') {
    relocationMenu(burgerPos, 67);
  };
  mainMenuMode();
};

function mainMenuMode() {
  setMode('menuMode');
  paintMask.classList.add('hidden');
  mask.style.zindex = 1;
  createCommentClickCheck();
  resetErrorMessage();
}

// Режим "Поделится"
const imgUrl = document.querySelector('.menu__url');
const copyUrlButton = document.querySelector('.menu_copy');
copyUrlButton.addEventListener('click', function () {
  imgUrl.select();
  document.execCommand('copy');
});
const share = document.querySelector('.share');
const shareEl = document.querySelector('.share-tools');
share.addEventListener('click', startShareMode);

function startShareMode() {
  const sharePos = wrap.offsetLeft + wrap.offsetWidth - menu.offsetWidth - 1;
  if (getComputedStyle(newPic).display === 'inline-block' && getComputedStyle(share).display === 'none') {
    relocationMenu(sharePos, 567);
  } else {
    relocationMenu(sharePos, 189);
  };
  shareMode();
};

function shareMode() {
  setMode('shareMode');
  createCommentClickCheck();
  resetErrorMessage();
};

//Режим "Рисование"
const draw = document.querySelector('.draw');
const drawEl = document.querySelector('.draw-tools');
const eraserEl = document.querySelector('.menu__eraser');
const paintMask = document.querySelector('.paint-mask');

draw.addEventListener('click', paintMode);

function paintMode() {
  setMode('drawMode');
  paintMask.style.zIndex = 4;
  paintMask.classList.remove('hidden');
  createCommentClickCheck();
  resetErrorMessage();
  resizePaintMask();
  const initMouse = {
    x: 0,
    y: 0
  };
  const curMouse = {
    x: 0,
    y: 0
  };
  const ctx = paintMask.getContext('2d');
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 5;

  paintMask.onmousedown = function (event) {
    initMouse.x = event.offsetX;
    initMouse.y = event.offsetY;
    ctx.drawing = true;
  }

  paintMask.onmousemove = function (event) {
    curMouse.x = event.offsetX;
    curMouse.y = event.offsetY;
    if (ctx.drawing) {
      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.moveTo(initMouse.x, initMouse.y);
      ctx.lineTo(curMouse.x, curMouse.y);
      ctx.closePath();
      ctx.stroke();
    }
    initMouse.x = curMouse.x;
    initMouse.y = curMouse.y;
  }

  paintMask.onmouseup = function (event) {
    ctx.drawing = false;
    sendPaintMask();
  }
  const menuColor = document.getElementsByClassName('menu__color')
  for (let i = 0; i < menuColor.length; i++) {
    menuColor[i].addEventListener('click', changeColor, false);
  };

  function changeColor(event) {
    ctx.strokeStyle = event.target.getAttribute('value');
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 5;
  }
  eraserEl.addEventListener('click', eraser, false);

  function eraser() {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 10;
  };
};

function resizePaintMask() {
  paintMask.width = mask.width = document.querySelector('.current-image').width;
  paintMask.height = mask.height = document.querySelector('.current-image').height;
};

function sendPaintMask() {
  console.log('Отправка рисунка');
  const imageData = paintMask.toDataURL('image/png');
  const byteArray = convertToBinary(imageData);
  websocket.send(byteArray.buffer);
};

//Преобразование paintMask в бинарный формат
function convertToBinary(data) {
  const marker = ';base64,';
  const markerIndex = data.indexOf(marker) + marker.length;
  const base64 = data.substring(markerIndex);
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const byteArray = new Uint8Array(new ArrayBuffer(rawLength));
  for (let i = 0; i < rawLength; i++) {
    byteArray[i] = raw.charCodeAt(i);
  };
  return byteArray;
};

//Режим "Комментирования"
const comments = document.querySelector('.comments');
const commentsEl = document.querySelector('.comments-tools');
const commentsOn = document.querySelector('.menu__toggle');
const initialFormComment = document.querySelector('.new_comment');
const initialFormCommentLoader = initialFormComment.querySelector('.comment_loader');
comments.addEventListener('click', commentsMode);

function commentsMode() {
  setMode('commentsMode');
  mask.style.zIndex = 3;
  resizePaintMask();
  resetErrorMessage();
  commentsToggle();
  commentsEl.addEventListener('click', commentsToggle);
  if (mask.classList.contains('hidden')) {
    img.addEventListener('click', commentAdd);
  } else {
    mask.addEventListener('click', commentAdd);
  };
};

function createCommentClickCheck() {
  if (mask.classList.contains('hidden')) {
    img.removeEventListener('click', commentAdd);
  } else {
    mask.removeEventListener('click', commentAdd);
  };
};

function commentsToggle() {
  const commentsForm = document.querySelectorAll('[data-top]');
  for (let i = 0; i < commentsForm.length; i++) {
    if (document.querySelector('.menu__toggle').checked) {
      console.log('Комментарии показаны');
      commentsForm[i].classList.remove('hidden');
    } else {
      console.log('Комментарии скрыты');
      commentsForm[i].classList.add('hidden');
    };
  };
};

function commentAdd(event) {
  const initialFormMarker = initialFormComment.querySelector('.comments__marker-checkbox');
  initialFormMarker.checked = true;
  const initialFormMessage = initialFormComment.querySelector('.comments__input');
  initialFormMessage.focus();
  const initialFormCloseButton = initialFormComment.querySelector('.comments__close');
  initialFormCloseButton.addEventListener('click', function () {
    initialFormComment.classList.add('hidden');
  });
  FormCommentLoader.style.display = 'none';
  initialFormComment.style.left = (event.offsetX) - 20 + 'px'
  initialFormComment.style.top = (event.offsetY) - 16 + 'px';
  initialFormComment.classList.remove('hidden');
  initialFormComment.reset();
};

function commentsLoad(comments) {
  for (let comment in comments) {
    const loadedComment = {
      message: comments[comment].message,
      left: comments[comment].left,
      top: comments[comment].top
    };
    renderComment(loadedComment);
  };
};

function renderComment(loadedComment) {
  initialFormComment.classList.add('hidden');
  const loadForm = document.querySelector(`.comments__form[data-left="${loadedComment.left}"][data-top="${loadedComment.top}"]`);
  if (loadForm) {
    const commentLoader = loadForm.querySelector('.comment_loader');
    commentLoader.style.display = 'none';
    renderCommentForm(loadForm, loadedComment);
  } else {
    createComment(loadedComment);
  };
};

function getMessageTime() {
  const date = new Date();
  const messageTime = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  return messageTime;
};

function createComment(comment) {
  console.log('Создание комментария');
  const originCommentForm = initialFormComment;
  const commentForm = originCommentForm.cloneNode(true);
  commentForm.classList.remove('hidden');
  commentForm.classList.remove('new_comment');
  commentForm.querySelector('.comments__submit').classList.add('on_place');
  commentForm.style.top = (comment.top) + 'px';
  commentForm.style.left = (comment.left) + 'px';
  commentForm.dataset.top = comment.top;
  commentForm.dataset.left = comment.left;
  const commentLoader = commentForm.querySelector('.comment_loader');
  commentLoader.style.display = 'none';
  const marker = commentForm.querySelector('.comments__marker-checkbox');
  marker.checked = true;
  marker.disabled = false;
  marker.addEventListener('click', event => {
    const commentsForm = document.querySelectorAll('.comments__form');
    for (let i = 0; i < commentsForm.length; i++) {
      commentsForm[i].style.zIndex = '5';
    };
    event.currentTarget.parentNode.style.zIndex = '6';
  });
  const commentDateTime = commentForm.querySelector('.comment__time');
  commentDateTime.textContent = getMessageTime();
  const commentMessage = commentForm.querySelector('.comment__message');
  commentMessage.style.whiteSpace = 'pre';
  commentMessage.textContent = comment.message;
  const closeButton = commentForm.querySelector('.comments__close');
  closeButton.addEventListener('click', function () {
    commentForm.querySelector('.comments__marker-checkbox').checked = false
  }, false);
  pictureDiv.appendChild(commentForm);
  commentsToggle();
};

function renderCommentForm(loadForm, comment) {
  const loadFormCommentsBody = loadForm.querySelector('.comments__body');
  const originCommentForm = loadFormCommentsBody.querySelector('.comment');
  const commentForm = originCommentForm.cloneNode(true);
  const loadFormLoader = loadForm.querySelector('.comment_loader');
  const commentDateTime = commentForm.querySelector('.comment__time');
  commentDateTime.textContent = getMessageTime();
  const commentMessage = commentForm.querySelector('.comment__message');
  commentMessage.style.whiteSpace = 'pre';
  commentMessage.textContent = comment.message;
  loadFormCommentsBody.insertBefore(commentForm, loadFormLoader);
  loadForm.reset();
  commentsToggle();
};

function resetComment() {
  const commentsArr = document.querySelectorAll('[data-top]');
  for (let i = 0; i < commentsArr.length; i++) {
    pictureDiv.removeChild(commentsArr[i]);
  };
};

//Отправка комментария
pictureDiv.addEventListener('submit', submitComment, false);

function submitComment(event) {
  event.preventDefault();
  initialFormComment.classList.remove('hidden');
  initialFormCommentLoader.style.display = 'inline-block';
  const messageForm = event.target.querySelector('.comments__input');
  const commentData = {
    'message': messageForm.value,
    'left': parseInt(event.target.style.left),
    'top': parseInt(event.target.style.top)
  };
  const marker = event.target.querySelector('.comments__marker-checkbox');
  marker.checked = true;
  marker.disabled = false;
  sendComment(commentData);
  const commentLoader = event.target.querySelector('.comment_loader');
  commentLoader.style.display = 'inline-block';
};

function sendComment(data) {
  console.log('Отправка комментария');
  initialFormComment.reset();
  const commentBody = `message=${encodeURIComponent(data.message)}&left=${encodeURIComponent(data.left)}&top=${encodeURIComponent(data.top)}`;
  fetch('https://neto-api.herokuapp.com/pic/' + window.imgID + '/comments', {
      method: 'POST',
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: commentBody
    })
    .then(response => {
      if (200 <= response.status && response.status < 300) {
        console.log(response);
        return response;
      };
      throw new Error(response.statusText);
    })
    .then(response => response.json())
    .catch(error => {
      console.log(error);
      alert('Ошибка при отправке комментария');
    });
};
//Инициализация вебсокет-соединения
let websocket;

function wsConnect() {
  websocket = new WebSocket('wss://neto-api.herokuapp.com/pic/' + window.imgID);
  websocket.addEventListener('open', () => {
    document.querySelector('.menu__url').value = window.location.protocol + '//' + window.location.host + window.location.pathname + '?id=' + window.imgID;
    img.classList.remove('hidden');
    startShareMode();
    console.log('Вебсокет-соединение открыто');
  });
  websocket.addEventListener('close', event => {
    alert('Соединение разорвано');
    imgLoader.classList.add('hidden');
    console.log('Вебсокет-соединение закрыто');
    console.log(event);
  });
  websocket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    switch (data.event) {
    case 'pic':
      imgLoader.classList.add('hidden');
      img.src = data.pic.url;
      img.removeAttribute('new');
      resetComment();
      img.onload = function () {
        if (data.pic.mask) {
          mask.src = data.pic.mask;
          mask.classList.remove('hidden');
          resizePaintMask();
        };
        if (data.pic.comments) {
          commentsLoad(data.pic.comments);
        };
      };
      break;
    case 'comment':
      commentsToggle();
      renderComment(data.comment);
      break;
    case 'mask':
      mask.src = data.url;
      mask.classList.remove('hidden');
      break;
    };
    console.log(data);
  });
  websocket.addEventListener('error', error => {
    console.log(`Произошла ошибка: ${error.data}`);
  });
};

img.addEventListener('load', function () {
  pictureDiv.style.width = (img.width) + 'px';
  pictureDiv.style.height = (img.height) + 'px';
});
