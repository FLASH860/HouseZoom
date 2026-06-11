export const globeHtml = `
<!DOCTYPE html>
<html>
<head>

<script src="https://unpkg.com/three"></script>
<script src="https://unpkg.com/globe.gl"></script>

<style>
body {
  margin: 0;
  overflow: hidden;
  background: black;
}

#globeViz {
  width: 100vw;
  height: 100vh;
}
</style>

</head>

<body>

<div id="globeViz"></div>

<script>

const globe = Globe()
(document.getElementById('globeViz'))
.globeImageUrl(
'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
)
.backgroundImageUrl(
'https://unpkg.com/three-globe/example/img/night-sky.png'
);

window.rotateToLocation = function(lat, lng) {

  globe.pointOfView(
    {
      lat: lat,
      lng: lng,
      altitude: 0.3
    },
    4000
  );

};


</script>

</body>
</html>
`;