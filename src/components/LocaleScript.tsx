export function LocaleScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var k="plantcare-locale";var m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)"));var c=m?decodeURIComponent(m[1]):null;var s=localStorage.getItem(k);var l=(c==="fa"||c==="en")?c:(s==="fa"||s==="en")?s:"en";var d=l==="fa"?"rtl":"ltr";document.documentElement.lang=l;document.documentElement.dir=d;}catch(e){}})();`,
      }}
    />
  );
}
