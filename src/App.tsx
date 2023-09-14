import csvtojson from "csvtojson";
import mapboxgl, { Map } from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import { useEffect, useRef, useState } from "react";
import { Badge, Card, Container, Navbar } from "react-bootstrap";
import ReactDOMServer from "react-dom/server";
import { BiWorld } from "react-icons/bi";
import { MdLocationOn, MdPhone } from "react-icons/md";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoicS1jb3JyZWEiLCJhIjoiY2xtaW95OGlpMGNpdDNsczhra2RjZHFtciJ9.6cfOEXOU0X1UF63H8H5MJA";
const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1cgvR9DV30Oj-B5NIluqbxrHbNbRs-2a3exWEcMnVO1o/gviz/tq?tqx=out:csv&sheet=Sheet1";

const App = () => {
  const mapContainer = useRef(null);
  const map = useRef<Map>(null);
  const [start, setStart] = useState([0, 0]);
  const [storeList, setStores] = useState([]);

  useEffect(() => {
    initMap();
  }, []);

  const initMap = async () => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12", // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
      center: [0, 0], // starting position [lng, lat]
      zoom: 10, // starting zoom

      //transformRequest: transformRequest,
    });
    let res = await (await fetch(SPREADSHEET_URL)).text();
    const stores = await csvtojson({
      noheader: false,
      output: "json",
    }).fromString(res);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((e) => {
        setStart([e.coords.longitude, e.coords.latitude]);
      });
    }

    map.current.addLayer({
      id: "csvData",
      type: "circle",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stores.map((e, i) => ({
            type: "Feature",
            id: i,
            geometry: {
              type: "Point",
              coordinates: [e.Longitude, e.Latitude],
            },
            properties: {
              name: e.Name,
              phone: e.Phone,
              address: e.Address,
              notes: e.Notes,
              website: e.Website,
              image_link: e.Image_link,
              type: e.Type,
            },
          })),
        },
      },
      paint: {
        "circle-radius": 7,
        "circle-color": "#e31337",
      },
    });

    map.current.on("click", "csvData", function (e) {
      //@ts-ignore
      var coordinates = e.features[0].geometry.coordinates;
      console.log(e.features[0]);
      const { name, phone, address, notes, website, image_link, type } =
        e.features[0].properties;
      //set popup text
      //You can adjust the values of the popup to match the headers of your CSV.
      // For example: e.features[0].properties.Name is retrieving information from the field Name in the original CSV.
      var description = ReactDOMServer.renderToString(
        <Card>
          <Card.Img variant="top" src={image_link} />
          <Card.Body style={{ padding: 10 }}>
            <Card.Title>{name}</Card.Title>
            <Card.Subtitle>
              <MdLocationOn />
              {address}
            </Card.Subtitle>
            <Card.Text style={{ marginTop: 20 }}>{notes}</Card.Text>
            <Container
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 0,
              }}
            >
              <span>
                <BiWorld />
                <Card.Link href={website}>Website</Card.Link>
              </span>
              <span>
                <MdPhone />
                <Card.Link href={phone}>{phone}</Card.Link>
              </span>
              <Badge bg="secondary">{type}</Badge>
            </Container>
          </Card.Body>
        </Card>
      );

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      //add Popup to map

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map.current);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.current.on("mouseenter", "csvData", function () {
      map.current.getCanvas().style.cursor = "pointer";
    });

    // Change it back to a pointer when it leaves.
    map.current.on("mouseleave", "places", function () {
      map.current.getCanvas().style.cursor = "";
    });
    map.current.on("load", function () {
      map.current.resize();
    });
    setStores(stores);
  };

  useEffect(() => {
    console.log(start);
    map.current.setCenter({ lat: start[1], lng: start[0] });
  }, [start]);

  return (
    <div className="App">
      <Navbar bg="black" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">
            <img
              alt=""
              src="/002.png"
              width="50"
              height="50"
              className="d-inline-block "
              style={{ marginRight: 10 }}
            />{" "}
            Keychain Stores{" "}
            {storeList.length ? <span>: {storeList.length}</span> : null}
          </Navbar.Brand>
        </Container>
      </Navbar>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default App;
