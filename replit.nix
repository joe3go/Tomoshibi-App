
{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.flask
    pkgs.python311Packages.flask-cors
    pkgs.python311Packages.requests
  ];
}
