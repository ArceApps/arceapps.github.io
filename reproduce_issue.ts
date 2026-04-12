import { getRouteFromUrl } from './src/i18n/utils';
import { ui } from './src/i18n/ui';

function test() {
    const urls = [
        new URL('http://localhost/'),
        new URL('http://localhost/es'),
        new URL('http://localhost/es/'),
        new URL('http://localhost/es/blog'),
        new URL('http://localhost/unknown/blog'),
    ];

    urls.forEach(url => {
        try {
            console.log(`URL: ${url.pathname} -> Result: ${getRouteFromUrl(url)}`);
        } catch (e) {
            console.error(`URL: ${url.pathname} -> Error: ${e.message}`);
        }
    });
}

test();
