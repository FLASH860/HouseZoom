import { Image } from 'react-native';
import React, {useRef, useState} from 'react';
import { Linking } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import WebView from 'react-native-webview';
import {useEffect} from 'react';
import {globeHtml} from './globehtml';

export default function App() {
  const [search, setSearch] = useState('');
  const [satelliteMode, setSatelliteMode] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  const [globeMode, setGlobeMode] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);


  const scaleAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);
  const globeRef = useRef<WebView>(null);
  const [customMarker, setCustomMarker] = useState<any>(null);
  const cloudScale = useRef(new Animated.Value(1)).current;
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  

  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [targetLat, setTargetLat] = useState(12.9716);
  const [targetLng, setTargetLng] = useState(77.5946);

  useEffect(() => {

    if (!globeMode) {
      return;
    }

    globeRef.current?.injectJavaScript(`
      rotateToLocation(${targetLat}, ${targetLng});
      true;
    `);

  }, [targetLat, targetLng, globeMode]);

  const startCloudTransition = () => {

    setShowTransition(true);

    cloudScale.setValue(1);
    cloudOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(cloudScale, {
        toValue: 3,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(cloudOpacity, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cloudOpacity, {
          toValue: 0,
          duration: 2300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowTransition(false);
    });

  };

  const zoomToLocation = (latitude: number, longitude: number) => {

    if (globeMode) {

      setTimeout(() => {
        startCloudTransition();
      }, 3000);

      setTimeout(() => {

        setGlobeMode(false);

        setTimeout(() => {

          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 20,
              longitudeDelta: 20,
            },
            0,
          );

          setTimeout(() => {

            mapRef.current?.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.0002,
                longitudeDelta: 0.0002,
              },
              1500,
            );

          }, 50);

        }, 100);

      }, 4000);

    } else {

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 20,
          longitudeDelta: 20,
        },
        1500,
      );

      setTimeout(() => {

        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.0002,
            longitudeDelta: 0.0002,
          },
          2500,
        );

      }, 1600);

    }

  };

  const performSearch = async (query: string) => {
    try {
      const url =
        `http://10.234.18.13:8080/search?query=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      const text = await response.text();
      const data = JSON.parse(text);

      if (
        data.lat === undefined ||
        data.lng === undefined
      ) {
        Alert.alert(
          'ERROR',
          'lat/lng missing from response',
        );
        return;
      }

      const lat = Number(data.lat);
      const lng = Number(data.lng);

      setTargetLat(lat + (Math.random() * 0.00000001));
      setTargetLng(lng + (Math.random() * 0.00000001));

      if (globeMode) {

        setTimeout(() => {

          startCloudTransition();

        }, 3000);

        setTimeout(() => {

          setGlobeMode(false);

          setTimeout(() => {

            mapRef.current?.animateToRegion(
              {
                latitude: Number(data.lat),
                longitude: Number(data.lng),
                latitudeDelta: 20,
                longitudeDelta: 20,
              },
              0,
            );

            setTimeout(() => {

              mapRef.current?.animateToRegion(
                {
                  latitude: Number(data.lat),
                  longitude: Number(data.lng),
                  latitudeDelta: 0.0002,
                  longitudeDelta: 0.0002,
                },
                1500,
              );

            }, 50);

          }, 100);

        }, 4000);

      }

      const newRegion = {
        latitude: Number(data.lat),
        longitude: Number(data.lng),
        latitudeDelta: 0.0002,
        longitudeDelta: 0.0002,
      };

      if (!globeMode) {

        mapRef.current?.animateToRegion(
          {
            latitude: Number(data.lat),
            longitude: Number(data.lng),
            latitudeDelta: 20,
            longitudeDelta: 20,
          },
          1500,
        );

        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: Number(data.lat),
              longitude: Number(data.lng),
              latitudeDelta: 0.0002,
              longitudeDelta: 0.0002,
            },
            2500,
          );
        }, 1600);

        setRegion(newRegion);
      }
      setCustomMarker({
        latitude: Number(data.lat),
        longitude: Number(data.lng),
      });
    } catch (error: any) {
      Alert.alert(
        'FULL ERROR',
        error?.message
          ? error.message
          : JSON.stringify(error),
      );
    }
  };

  const handleSearch = async () => {
    try {

      await performSearch(search);

    } catch (error: any) {
      Alert.alert(
        'FULL ERROR',
        error?.message
          ? error.message
          : JSON.stringify(error),
      );
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(
        'http://10.234.18.13:8080/history',
      );

      const data = await response.json();

      setHistory(data);

      setShowHistory(!showHistory);
    } catch (error: any) {
      Alert.alert(
        'History Error',
        error.message,
      );
    }
  };

  const handleFavorite = async () => {
    try {
      if (!search.trim()) {
        Alert.alert('Enter a place first');
        return;
      }

      await fetch(
        `http://10.234.18.13:8080/addFavorite?place=${encodeURIComponent(search)}`
      );

      Alert.alert('Saved to Favorites');
    } catch (error: any) {
      Alert.alert(
        'Favorite Error',
       error.message,
      );
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch(
        'http://10.234.18.13:8080/favorites',
      );

      const data = await response.json();

      setFavorites(data);

      setShowFavorites(!showFavorites);
    } catch (error: any) {
      Alert.alert(
        'Favorites Error',
        error.message,
      );
    }
  };
  const toggleMapMode = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSatelliteMode(!satelliteMode);
  };

  const openStreetView = () => {

    if (!customMarker) {
      Alert.alert('Select a location first');
      return;
    }

    const url =
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${customMarker.latitude},${customMarker.longitude}`;

    Linking.openURL(url);
  };

  const goToCurrentLocation = async () => {
    try {

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Location permission denied');
        return;
      }

      Geolocation.getCurrentPosition(
        position => {

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          setCustomMarker({
            latitude,
            longitude,
          });

          setTargetLat(latitude);
          setTargetLng(longitude);

          zoomToLocation(latitude, longitude);

          

        },
        error => {
          Alert.alert('Location Error', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
        }
      );

    } catch (err) {
      Alert.alert('Error');
    }
  };

  return (
    <View style={styles.container}>
    
      <Text style={styles.title}>HouseZoom</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter place or coordinates"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}>
          <Text style={styles.buttonText}>
            SEARCH
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={loadHistory}>
          <Text style={styles.buttonText}>
            HISTORY
          </Text>
        </TouchableOpacity>
      </View>

      {showHistory && (
        <ScrollView
          style={styles.historyContainer}
          nestedScrollEnabled>
          {history.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => {
                setSearch(item);
                performSearch(item);
              }}>
              <Text style={styles.historyText}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showFavorites && (
        <ScrollView
          style={styles.historyContainer}
          nestedScrollEnabled>
          {favorites.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => {
                setSearch(item);
                performSearch(item);
              }}>
              <Text style={styles.historyText}>
                ⭐ {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={styles.mapContainer}>
        {!globeMode ? (

        <MapView
          ref={mapRef}
          showsUserLocation={true}
          onPress={async(e) => {
            const coords = e.nativeEvent.coordinate;

            setCustomMarker(coords);

            mapRef.current?.animateToRegion(
              {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.0002,
                longitudeDelta: 0.0002,
              },
              2000,
            );
            
            const response = await fetch(
              `http://10.234.18.13:8080/reverseGeocode?lat=${coords.latitude}&lng=${coords.longitude}`
            );

            const data = await response.json();

            setSelectedAddress(data.address);
            setShowLocationModal(true);
          
          
          }}

          style={styles.map}
          initialRegion={region}
          mapType={
            satelliteMode
              ? 'hybrid'
              : 'standard'
          }
          showsBuildings={true}
          pitchEnabled={true}
          rotateEnabled={true}>
          <Marker
            coordinate={
              customMarker || {
                latitude: region.latitude,
                longitude: region.longitude,
              }
            }
          anchor={{ x: 0.5, y: 1 }}
        >
          <Image
            source={require('./assets/marker.png')}
            style={{
              width: 60,
              height: 60,
            }}
            resizeMode="contain"
          />
        </Marker>
        </MapView>

        ) : (

        <WebView
          ref={globeRef}
          source={{html: globeHtml}}
          style={styles.map}
        />

        )}

        <Animated.View
          style={[
            styles.floatingButtonContainer,
            {
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={toggleMapMode}>
            <Text style={styles.floatingButtonText}>
              {satelliteMode ? '3D' : 'SAT'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View
          style={styles.favoriteButtonContainer}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavorite}
            onLongPress={loadFavorites}>
            <Text style={styles.favoriteButtonText}>
              ★
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={styles.globeButtonContainer}>
          <TouchableOpacity
            style={styles.globeButton}
            onPress={() => setGlobeMode(!globeMode)}>
            <Text style={styles.globeButtonText}>
              {globeMode ? '🗺️' : '🌎'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showTransition && (
        <Animated.Image
          source={require('./assets/clouds.png')}
          resizeMode="cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: cloudOpacity,
            transform: [{ scale: cloudScale }],
            zIndex: 9999,
          }}
        />
      )}

      <Animated.View
        style={{
          position: 'absolute',
          top: 135,
          left: 10,
        }}>

        <TouchableOpacity
          style={{
            width: 65,
            height: 65,
            borderRadius: 32.5,
            backgroundColor: '#2196F3',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
          }}
          onPress={goToCurrentLocation}>

          <Text
            style={{
              fontSize: 24,
            }}>
            📍
          </Text>

        </TouchableOpacity>

      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 215,
          left: 10,
        }}>

        <TouchableOpacity
          style={{
            width: 65,
            height: 65,
            borderRadius: 32.5,
            backgroundColor: '#444',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
          }}
          onPress={openStreetView}>

          <Text
            style={{
              fontSize: 24,
            }}>
            👁️
          </Text>

        </TouchableOpacity>

      </Animated.View>
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide">

        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}>

          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}>

            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
              }}>
              Selected Location
            </Text>

            <Text
              style={{
                marginTop: 10,
              }}>
              {selectedAddress}
            </Text>

            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={{
                marginTop: 15,
                backgroundColor: '#2196F3',
                padding: 12,
                borderRadius: 10,
              }}>

              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                }}>
                Close
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 10,
  },

  searchButton: {
    flex: 7,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginRight: 5,
  },

  historyButton: {
    flex: 3,
    backgroundColor: '#800020',
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  historyContainer: {
    maxHeight: 150,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },

  historyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  historyText: {
    fontSize: 16,
  },

  mapContainer: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  floatingButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  floatingButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },

  floatingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoriteButtonContainer: {
  position: 'absolute',
  top: 95,
  right: 20,
},

favoriteButton: {
  width: 65,
  height: 65,
  borderRadius: 32.5,
  backgroundColor: '#FFD700',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 8,
},

favoriteButtonText: {
  fontSize: 26,
  color: 'black',
  fontWeight: 'bold',
},
globeButtonContainer: {
  position: 'absolute',
  top: 170,
  right: 20,
},

globeButton: {
  width: 65,
  height: 65,
  borderRadius: 32.5,
  backgroundColor: '#222',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 8,
},

globeButtonText: {
  fontSize: 28,
},




});
  
