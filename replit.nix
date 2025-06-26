
{ pkgs }: {
  deps = [
    pkgs.python311Packages.unidic-lite
    pkgs.python311Packages.pykakasi
    pkgs.python311Packages.fugashi
    pkgs.python311
    pkgs.python311Packages.flask
    pkgs.python311Packages.flask-cors
    pkgs.python311Packages.requests
  ];
}
