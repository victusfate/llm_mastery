import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('serve', Path(__file__).resolve().parents[1] / 'scripts/serve.py')
serve = importlib.util.module_from_spec(spec)
spec.loader.exec_module(serve)

class PublicFilesTest(unittest.TestCase):
    def test_course_assets(self):
        self.assertEqual(serve.public_file('/site/').name, 'index.html')
        self.assertEqual(serve.public_file('/site/app.mjs?x=1').name, 'app.mjs')
        self.assertIsNotNone(serve.public_file('/docs/00-personalized-bootcamp.md'))

    def test_private_paths_and_traversal_are_unavailable(self):
        for path in ['/private/profile.md', '/.git/config', '/../etc/passwd', '/%2e%2e/etc/passwd', '/scripts/serve.py', '/docs/', '/site/no-such-file.js']:
            self.assertIsNone(serve.public_file(path), path)

if __name__ == '__main__':
    unittest.main()
