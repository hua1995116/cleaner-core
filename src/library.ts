import * as fs from 'fs';
import { AppRule } from './rules';
import * as plist from 'plist';
import { ProjectInfo } from './fsSystem';
import * as path from 'path';
import * as multimatch from 'multimatch';
import { IGNORE_FILES } from './constant';
import * as home from 'home';

function parseLibrary(application: AppRule) {
  const { type: libraryType, path: libraryPath } = application;
  const librarys = fs.readdirSync(libraryPath);
  const infos: ProjectInfo[] = [];

  const cacheList = [];
  librarys.forEach(item => {
    if (multimatch([item], IGNORE_FILES).length !== 0) {
      return;
    }
    const infoPath = path.join(libraryPath, item, 'Contents/Info.plist');
    if (!fs.existsSync(infoPath)) {
      return
    }
    const infoStr = fs.readFileSync(infoPath).toString();
    try {
      const infoList = plist.parse(infoStr);
      if (infoList.CFBundleIconFile && infoList.CFBundleName && infoList.CFBundleIdentifier) {
        const icon = infoList.CFBundleIconFile.includes('.icns') ? infoList.CFBundleIconFile : infoList.CFBundleIconFile + '.icns';
        cacheList.push({
          icon: path.join(libraryPath, item, 'Contents/Resources', icon),
          name: infoList.CFBundleName,
          pkgName: infoList.CFBundleIdentifier,
          i18n: [] // 获取目录下的语言名字文件
        })
      }
    } catch (e) {

    }
  })
  cacheList.forEach(item => {
    const { icon, name, pkgName } = item;
    const containPath = home.resolve(`~/Library/Containers/${pkgName}/`);
    if (!fs.existsSync(containPath)) {
      return
    }
    const cachePath = path.join(containPath, './Data/Library/Caches');
    if (!fs.existsSync(cachePath)) {
      return;
    }
    try {
      fs.readdirSync(cachePath);
    } catch (e) {
      return;
    }
    const projectInfo: ProjectInfo = {
      path: cachePath,
      computed: './',
      size: 0,
      formatSize: '',
      type: libraryType
    };
    infos.push(projectInfo);
  })
  return infos;
}

export default parseLibrary;