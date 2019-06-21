// ==UserScript==
// @namespace   https://greasyfork.org/en/users/131965-levinit
// @author      levinit
// @name        Bing Image Download Button
// @name:zh-CN  必应图片下载按钮
// @name:zh-TW  必應圖片下載按鈕
// @name:ko     Bing 이미지 다운로드 버튼
// @name:fr     Bouton de téléchargement d'image Bing
// @name:ja     Bing画像ダウンロードボタン
// @description Add an image download button on Bing's home page.
// @description:zh-CN  在必应首页添加一个图片下载按钮。
// @description:zh-TW  在必應首頁添加一个圖片下載按鈕。
// @description:ko    빙 홈페이지에 이미지 다운로드 버튼 추가
// @description:fr    Ajouter le bouton de téléchargement d'image à la page d'accueil Bing.
// @description:ja    Bingホームページに画像ダウンロードボタンを追加する。
// @include     *://cn.bing.com/
// @include     *://www.bing.com/
// @include     *://www.bing.com/?*
// @include     *://cn.bing.com/?*
// @run-at      document-start
// @version     1.0.1
// @grant       none
// ==/UserScript==

const bingDownloadBtnConfig = {
  //下载按钮样式
  btnStyles: {
    'color': '',
    'font-size': '1.5em',
    'padding': '0.25em',
    'border-radius': '0.25em',
    'box-shadow': '0 0 3 px rgba(125, 125, 125, 0.25)',
    'right': '20%',
    'top': '12.5%',
    'background': '#c3d1cf94',
    'position': 'fixed'
  },
  //下载按钮上的文字
  btnText: function () {
    let text = 'Download Today Bing Picture' //lang en
    switch (navigator.language) {
      case 'zh':
      case 'zh-CN':
      case 'zh-SG':
        text = '下载今日必应图片'
        break;
      case 'zh-TW':
      case 'zh-HK':
        text = '下載今日必應圖片'
        break;
      case 'ko':
      case 'ko_KR':
        text = '오늘의 빙 이미지 다운로드'
        break;
      case 'ja':
      case 'ja_JP':
        text = '今日のBing画像をダウンロードする'
        break
      case 'fr':
      case 'fr_BE':
      case 'fr_CA':
      case 'fr_CH':
      case 'fr_FR':
      case 'fr_LU':
        text = 'Téléchargez les images de bing aujourd’hui'
        break
      default:
        break;
    }
    return text
  },
  //图片信息
  imgInfo: {
    url: '',
    name: "",
    'desc-ele-id': 'sh_cp',  //含有图片描述信息的元素的id
    'name-rule': {
      'baseName': true,
      'imgNO': false,
      'imgResolution': false,
      'dateInfo': true,
      'description': false,  //图片描述信息
      'copyright': false  //图片版权信息
    },
    //图片分辨率 不设置则使用默认 默认分辨率一般和当前系统设置、显示器分辨率有关
    resolution: '' //1366x768 1280x720 1920x1080
  },
  //设置菜单
  menuInfo: {
    menuWrapStyles: {
      'position': 'fixed',
      'z-index': '9',
      'right': '1%',
      'top': '5%',
      'font-size': '1.25em',
      'display': 'none'
    },
    menuWrapId: 'bing-download-settings',
    resetBtnId: 'reset-menu-settings',
    closeBtnClass: 'close-settings-menu',
    saveBtnId: 'save-menu-settings'
  },
  //本项目信息
  about: {
    github: 'https://github.com/levinit/bing-image-download-button',
    greasyfork: 'https://greasyfork.org/zh-TW/scripts/35070-bing-image-download-button'
  },
  //本地存储 菜单中设置的信息 使用的key
  localStoreKey: 'bingImgDownload'
}

window.addEventListener(
  'load',
  function () {
    getSavedSettings(bingDownloadBtnConfig)  //从本地存储读取设置信息

    /*获取图片地址
    进入bing页面后 图片地址写在了一个id为'bgLink'的a元素的href属性中
    */
    const initImgUrl = document.getElementById('bgLink').href

    //设置图片信息
    getImgInfo(bingDownloadBtnConfig.imgInfo, initImgUrl)

    if (initImgUrl) {
      //添加下载按钮
      addBtn(bingDownloadBtnConfig)
      addMenu(bingDownloadBtnConfig)
    }
  }, {
    once: true
  })

//从本地存储中取得设置的信息写入到bingDownloadBtn各个项中
function getSavedSettings(info) {
  if (localStorage.getItem(info.localStoreKey)) {

    //本地存储的设置信息
    const savedSettings = JSON.parse(localStorage.getItem(bingDownloadBtnConfig.localStoreKey))
    const setSettings = function (settingsObj, savedSettingsObj) {
      //遍历本地存储的设置信息，写入到bingDownloadBtn各个项中
      for (const item in savedSettingsObj) {
        if (settingsObj.hasOwnProperty(item)) {
          settingsObj[item] = savedSettingsObj[item]
        }
      }
    }

    //写入图片设置信息 （命名规则和分辨率)
    setSettings(info.imgInfo, savedSettings.imgInfo)
  }
}

//-----获取图片信息(根据设置规则修改）
function getImgInfo(imgInfo, url) {
  //如果没有传入url 则使用imgInfo的url
  url = url ? url : imgInfo.url
  // const re = /(?<=id=).+\.(jpg|png)/  //慎用：某些浏览器还不支持向前查找
  // bingDownloadBtn.imgInfo.name = /id=.+?\.(jpg|png)/.exec(url)[0].replace('id=', '')
  //图片地址  根据分辨率设置修改图片地址 分辨率如1920x1080 如果未设置分辨率将使用默认分辨率
  url = imgInfo['resolution'] ? url.replace(/\d{4}x\d{3,4}/, imgInfo['resolution']) : url

  /*图片名字  根据图片地址生成图片原始名字
  原始示例 AberystwythSeafront_ZH-CN9542789062_1920x1080.jpg
  原始名字分成三部分 baseName imgNO resolution
  */
  //原始名字去掉前面的OHR.字样 使用_切分图片名

  const nameInfo = /id=.+?\.(jpg|png)/.exec(url)[0].replace('id=', '').replace(/^OHR\./, '').split('_')

  //图片格式
  const imgFormat = /(jpg|png)$/.exec(nameInfo)[0]

  // 图片描述信息
  const imgDescription = document.getElementById(imgInfo['desc-ele-id']).title.split('©')

  let [baseName, imgNO, resolution, description, copyright, dateInfo] = ['', '', '', '', '', '']

  //日期信息
  const now = new Date()

  //根据名字生成规则修改图片名字
  for (const rule in imgInfo['name-rule']) {
    const ruleValue = imgInfo['name-rule'][rule]
    if (ruleValue === true) {
      switch (rule) {
        case 'baseName':
          baseName = `${nameInfo[0]}`
          break;
        case 'imgNO':
          imgNO = `_${nameInfo[1]}`
          break;
        case 'imgResolution':
          resolution = `_${nameInfo[2]}`.split('.')[0]
          break;
        case 'dateInfo':
          dateInfo = `_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
          break;
        case 'description':
          description = `_${imgDescription[0].replace(/\($/, '')}`
          break;
        case 'copyright':
          copyright = `(©${imgDescription[1]}`
          break;
        default:
          break;
      }
    }
  }

  //拼接图片名字 去掉前后可能出现的_
  let name = `${baseName}${imgNO}${resolution}${description}${copyright}${dateInfo}`.replace(/^_/, '').replace(/_$/, '')

  //如果图片没有名字只有后缀 强行给图片加上名字
  if (name === `.${imgFormat}`) {
    name = `${nameInfo[0]}.${imgFormat}`
  } else {
    name = `${name}.${imgFormat}`
  }

  bingDownloadBtnConfig.imgInfo.url = url
  bingDownloadBtnConfig.imgInfo.name = name
}

//-------添加下载按钮
function addBtn(info) {
  const btn = document.createElement('a')
  btn.appendChild(document.createTextNode(info.btnText()))


  btn.style.cssText = (function (styles) {
    let btnCssText = ''
    for (let style in styles) {
      btnCssText += `${style}: ${styles[style]}; `
    }
    return btnCssText
  })(info.btnStyles)

  btn.href = info.imgInfo.url  //图片下载地址
  btn.download = info.imgInfo.name  //图片下载名字
  btn.title = `img name: ${info.imgInfo.name}
  右键打开设置菜单|Right Click this button to open settings menu`
  document.body.appendChild(btn)

  //更新下载信息 点击了前一天或后一天按钮后 需要刷新img的下载地址
  btn.onmouseover = function () {
    /* 新图片地址将写在id为bgDiv的元素的行内style的background-image属性中
      background-image值示例：/th?id=OHR.GOTPath_ZH-CN1955635212_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp
    */

    //图片新url
    let newUrl = document.getElementById('bgDiv').style.backgroundImage
    newUrl = newUrl.substring(5, newUrl.length - 2)

    //点击了前一天后一天按钮后更新图片下载地址和名字
    //没有点击前一天或后一天按钮 background-image不存在 则newUrl内容是空的
    if (newUrl) {
      getImgInfo(info.imgInfo, newUrl)
    }

    this.href = info.imgInfo.url
    this.download = info.imgInfo.name
  }

  //右键打开设置菜单
  btn.oncontextmenu = function (e) {
    e.preventDefault()
    document.getElementById(info.menuInfo.menuWrapId).style.display = 'block'
  }
}

//-----设置菜单
function addMenu(info) {
  const menuInfo = info.menuInfo

  //先前已经存储的图像分辨率设置信息
  const savedImgResolution = info.imgInfo['resolution']
  //先前已经存储的图像规则信息
  const savedImgNameRule = info.imgInfo['name-rule']

  const menuContent = `
  <fieldset id="btn-settings">
  <legend>settings</legend>
  <div class="settings-content">
    <ul class="img-infos">
      <header>
        Image Info
      </header>
      <li>
        <header>
          Image Name contains:
        </header>
        <div>
          <label>Base-Name</label>
          <input class="img-info" type="checkbox" name="name-rule" checked data-img-name-rule="baseName" />
        </div>
        <div>
          <label>NO.</label>
          <input class="img-info" type="checkbox" name="name-rule" data-img-name-rule="imgNO"
            ${savedImgNameRule['imgNO'] ? 'checked' : ''} />
        </div>
        <div>
          <label>Resolution</label>
          <input class="img-info" type="checkbox" name="name-rule" data-img-name-rule="imgResolution"
            ${savedImgNameRule['imgResolution'] ? 'checked' : ''} />
        </div>
        <div>
          <label>Description</label>
          <input class="img-info" type="checkbox" name="name-rule" data-img-name-rule="description"
            ${savedImgNameRule['description'] ? 'checked' : ''} />
        </div>
        <div>
          <label>CopyRight</label>
          <input class="img-info" type="checkbox" name="name-rule" data-img-name-rule="copyright"
            ${savedImgNameRule['copyright'] ? 'checked' : ''} />
        </div>
        <div>
          <label>Date-Info</label>
          <input class="img-info" type="checkbox" name="name-rule" data-img-name-rule="dateInfo"
            ${savedImgNameRule['dateInfo'] ? 'checked' : ''} />
        </div>
      </li>
      <li>
        <header>
          Image Resolution
        </header>
        <div>
          <label>1920x1080</label>
          <input class="img-info" type="radio" name="resolution" data-img-resolution="1920x1080"
            ${savedImgResolution === '1920x1080' ? 'checked' : ''} />
        </div>
        <div>
          <label>1366x768</label>
          <input class="img-info" type="radio" name="resolution" data-img-resolution="1366x768"
            ${savedImgResolution === '1366x768' ? 'checked' : ''} />
        </div>
        <div>
          <label>1280x720</label>
          <input class="img-info" type="radio" name="resolution" data-img-resolution="1280x720"
            ${savedImgResolution === '1280x720' ? 'checked' : ''} />
        </div>
        <div>
        <label>Default</label>
        <input class="img-info" type="radio" name="resolution" data-img-resolution="" ${savedImgResolution === ''
      ? 'checked' : ''} />
      </div>
      </li>
    </ul>
    <div class="about">
      About:
      <a href="${info.about.github}">GitHub</a>
      <a href="${info.about.greasyfork}">GreasyFork</a>
    </div>
  </div>
  <footer>
    <button id="${menuInfo.resetBtnId}" class="reset-btn">reset</button>
    <button id="${menuInfo.saveBtnId}" class="${menuInfo.closeBtnClass}">save</button>
    <button class="${menuInfo.closeBtnClass}">cancel</button>
  </footer>
</fieldset>

<style>
  #btn-settings {
    width: 300px;
    border: 1px dashed gainsboro;
    border-radius: 8px;
    box-shadow: 0 0 10px gainsboro;
    background-color: aliceblue;
  }

  #btn-settings legend {
    font-weight: bold;
    text-shadow: 0 0 2px gray;
    color: steelblue;
  }


  #btn-settings ul {
    padding: 0;
  }

  #btn-settings ul>header {
    width: 100%;
    border-bottom: 3px groove gainsboro;
    font-weight: bold;
    color: slategrey;
    text-shadow: 0 0 5px gainsboro;
    margin-bottom: 0.5em;
  }

  #btn-settings li {
    list-style-type: none;
    border-bottom: 1px dashed gainsboro;
    padding-bottom: 0.5em;
  }


  .img-infos label {
    width: 80%;
    display: inline-block;
  }

  .img-infos li header {
    color: sienna;
    margin-bottom: 0.25em;
  }

  #btn-settings .about {
    text-align: right;
    margin-bottom: 1em;

  }

  #btn-settings .about a {
    margin-right: 1em;
  }

  #btn-settings footer {
    text-align: right;
  }

  #btn-settings footer button {
    width: 88px;
    cursor: pointer;
    font-size: 1.2em;
    font-weight: bold;
    line-height: 1.25;
    text-align: center;
    padding: 0;
    color: teal;
  }

  #btn-settings footer .reset-btn {
    margin-right: 25px;
    color: tomato;
  }
</style>
`
  //添加菜单
  const menu = document.createElement('div')
  menu.innerHTML = menuContent
  menu.id = info.menuInfo.menuWrapId
  let cssText = ''
  //设置菜单样式
  for (const style in menuInfo.menuWrapStyles) {
    cssText += `${style}:${menuInfo.menuWrapStyles[style]};`
  }
  menu.style.cssText = cssText
  document.body.appendChild(menu)


  //菜单的事件绑定：保存 重置 和 取消
  menu.onclick = function (e) {
    if (e.target.classList.contains(menuInfo.closeBtnClass)) {
      //如果点击的保存或取消按钮 关闭设置菜单
      menu.style.display = 'none'

      //如果点击的是保存按钮 存储设置的信息
      if (e.target.id === menuInfo.saveBtnId) {
        localStorage.setItem(info.localStoreKey, JSON.stringify(getUserSettings(info)))
        getSavedSettings(info)
        getImgInfo(info.imgInfo)  //刷新图片相关信息
      }
    }

    //如果点击的是重置按钮 清空设置
    if (e.target.id === menuInfo.resetBtnId) {
      localStorage.removeItem(info.localStoreKey)
      getSavedSettings(info)
      getImgInfo(info.imgInfo)  //刷新图片相关信息
    }

  }
}

function getUserSettings() {
  //btn-styles
  const btnStyles = {}

  for (const item of document.querySelectorAll('.btn-style')) {
    let value = item.value
    //未设置的属性 以及position设置中未选择的属性 忽略
    if (item.value === "" || item.previousElementSibling.type === 'radio' && item.previousElementSibling.checked === false) {
      continue
    }
    const property = item.getAttribute('data-property')
    btnStyles[property] = value
  }


  //img-info
  const imgInfo = {
    'name-rule': {}
  }

  for (const item of document.querySelectorAll('.img-info')) {
    switch (item.name) {
      //图片命名规则
      case 'name-rule':
        imgInfo['name-rule'][item.getAttribute('data-img-name-rule')] = item.checked
        break
      //分辨率
      case 'resolution':
        imgInfo['resolution'] = item.getAttribute('data-img-resolution')
        break
      default:
        break
    }
  }
  return { btnStyles, imgInfo }
}