#!/usr/bin/env python3
"""Package the stable upstream binary/JS unchanged, updating only its type pin."""
import base64
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parent
URL = 'https://registry.npmjs.org/rolldown/-/rolldown-1.2.16.tgz'
INTEGRITY = 'bWvlMpFKiTfDKfnK7FC2MPgPeWCf/Kpwsq49ApdW+FQaBZb6O6dZ4MAPbPUjp7hYQrw/RobqCzn64BRrQecGHw=='

def main():
    data = urllib.request.urlopen(URL).read()
    assert base64.b64encode(hashlib.sha512(data).digest()).decode() == INTEGRITY, 'upstream integrity mismatch'
    output = ROOT / 'dist'
    output.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='hub-rolldown-') as temporary:
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
            archive.extractall(temporary, filter='data')
        package = Path(temporary) / 'package'
        manifest = json.loads((package / 'package.json').read_text())
        assert manifest['dependencies']['@oxc-project/types'] == '=0.156.0'
        manifest['version'] = '1.2.16+hub.1'
        manifest['dependencies']['@oxc-project/types'] = '0.157.0'
        manifest['repository']['url'] = 'git+https://github.com/ndkedrov/rolldown.git'
        manifest['files'].append('hub-provenance.json')
        (package / 'package.json').write_text(json.dumps(manifest, indent=2) + '\n')
        provenance = {'upstream': URL, 'integrity': 'sha512-' + INTEGRITY,
                      'patch': '@oxc-project/types 0.156.0 -> 0.157.0; runtime and native bindings unchanged',
                      'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()}
        (package / 'hub-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
        subprocess.run(['npm', 'pack', '--ignore-scripts', '--pack-destination', str(output)], cwd=package, check=True)

if __name__ == '__main__':
    main()
