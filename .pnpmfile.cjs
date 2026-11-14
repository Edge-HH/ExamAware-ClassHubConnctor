// 已发布的 @dsz-examaware/plugin-sdk@1.6.1 仍把内部依赖写成 workspace:*，
// 单独安装时改成 npm 上的对应版本。
function readPackage(pkg) {
  const replacements = {
    '@dsz-examaware/core': '1.1.1',
    '@dsz-examaware/rpc': '0.3.0'
  }
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = pkg[field]
    if (!deps) continue
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*' && replacements[name]) deps[name] = replacements[name]
    }
  }
  return pkg
}

module.exports = {
  hooks: { readPackage }
}
