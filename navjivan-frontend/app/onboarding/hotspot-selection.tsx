import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import {
  addGeofenceZone,
  GeofenceZone,
  getCurrentLocation,
  getGeofenceZones,
  requestPermissions,
} from '../../services/geofencing';
import { LPHaptics } from '../../services/haptics';

const { width: W, height: H } = Dimensions.get('window');

const SUGGESTED_HOTSPOTS = [
  { icon: '🏢', name: 'Office Break Area', desc: 'Where colleagues smoke' },
  { icon: '🏠', name: 'Home Balcony', desc: 'Your usual smoking spot at home' },
  { icon: '☕', name: 'Chai Stall', desc: 'Local tea shop where you smoke' },
  { icon: '🚌', name: 'Bus Stop', desc: 'Waiting area where you light up' },
  { icon: '🍺', name: 'Bar/Pub', desc: 'Places you drink and smoke' },
];

export default function HotspotSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth: any = useContext(AuthContext);
  const mapRef = useRef<MapView>(null);

  // Get app mode from params
  const appMode = params.appMode as string || 'solo';
  const isDuoMode = appMode === 'duo';

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  
  // Add zone modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneRadius, setZoneRadius] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Location Required',
          'We need location access to set up smoking trigger zones.',
          [{ text: 'OK' }]
        );
      }

      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      // Load existing zones
      const savedZones = await getGeofenceZones();
      setZones(savedZones.filter(z => z.type === 'trigger'));
    } catch (err) {
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e: any) => {
    LPHaptics.selection();
    setSelectedLocation(e.nativeEvent.coordinate);
    setShowAddModal(true);
  };

  const handleAddZone = async () => {
    if (!selectedLocation || !zoneName.trim()) {
      Alert.alert('Required', 'Please enter a name for this zone');
      return;
    }

    setSaving(true);
    try {
      const newZone: GeofenceZone = {
        id: `hotspot_${Date.now()}`,
        name: zoneName.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radius: parseInt(zoneRadius) || 100,
        type: 'trigger',
        notifyOnEnter: true,
        notifyOnExit: false,
      };

      await addGeofenceZone(newZone);
      setZones(prev => [...prev, newZone]);
      LPHaptics.success();
      
      setShowAddModal(false);
      setSelectedLocation(null);
      setZoneName('');
      setZoneRadius('100');
    } catch (err) {
      console.error('Error adding zone:', err);
      LPHaptics.error();
      Alert.alert('Error', 'Failed to add zone. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    LPHaptics.success();
    router.push('/onboarding/questionnaire');
  };

  const handleSkip = () => {
    LPHaptics.selection();
    router.push('/onboarding/questionnaire');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation ? {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Existing zones */}
        {zones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Circle
              center={{ latitude: zone.latitude, longitude: zone.longitude }}
              radius={zone.radius}
              fillColor="rgba(255, 107, 107, 0.3)"
              strokeColor="#FF6B6B"
              strokeWidth={2}
            />
            <Marker
              coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
              title={zone.name}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="warning" size={20} color="#FFF" />
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Selected location preview */}
        {selectedLocation && (
          <Circle
            center={selectedLocation}
            radius={parseInt(zoneRadius) || 100}
            fillColor="rgba(255, 107, 107, 0.2)"
            strokeColor="#FF6B6B"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Overlay Header */}
      <SafeAreaView style={styles.overlay}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <LinearGradient
            colors={['rgba(30,30,46,0.95)', 'rgba(30,30,46,0.8)', 'transparent']}
            style={styles.headerGradient}
          >
            <Text style={styles.title}>📍 Mark Your Smoking Hotspots</Text>
            <Text style={styles.subtitle}>
              Tap on the map to mark places where you usually smoke.{'\n'}
              We'll send you support when you're near these zones.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Suggestions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Common trigger locations:</Text>
          <View style={styles.suggestionsRow}>
            {SUGGESTED_HOTSPOTS.slice(0, 3).map((spot, i) => (
              <View key={i} style={styles.suggestionChip}>
                <Text style={styles.suggestionIcon}>{spot.icon}</Text>
                <Text style={styles.suggestionName}>{spot.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Zone count */}
          {zones.length > 0 && (
            <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.zoneCount}>
              <Ionicons name="location" size={18} color="#FF6B6B" />
              <Text style={styles.zoneCountText}>{zones.length} hotspot{zones.length !== 1 ? 's' : ''} marked</Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.continueBtn, zones.length === 0 && styles.continueBtnDisabled]}
              onPress={handleContinue}
            >
              <LinearGradient
                colors={zones.length > 0 ? ['#2ECC71', '#27AE60'] : ['#666', '#555']}
                style={styles.continueBtnGradient}
              >
                <Text style={styles.continueBtnText}>
                  {zones.length > 0 ? 'Continue' : 'Add at least 1 zone'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* My Location Button */}
          <TouchableOpacity 
            style={styles.myLocationBtn}
            onPress={() => {
              if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  ...currentLocation,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 500);
              }
            }}
          >
            <Ionicons name="locate" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Add Zone Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚭 Add Smoking Hotspot</Text>
            <Text style={styles.modalSub}>
              You'll receive support notifications when you're near this zone.
            </Text>

            <Text style={styles.inputLabel}>Zone Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Office smoking area, Balcony..."
              placeholderTextColor="#888"
              value={zoneName}
              onChangeText={setZoneName}
            />

            <Text style={styles.inputLabel}>Radius (meters)</Text>
            <View style={styles.radiusRow}>
              {['50', '100', '150', '200'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, zoneRadius === r && styles.radiusChipActive]}
                  onPress={() => setZoneRadius(r)}
                >
                  <Text style={[styles.radiusText, zoneRadius === r && styles.radiusTextActive]}>
                    {r}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.addBtn, saving && { opacity: 0.6 }]} 
              onPress={handleAddZone}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#FFF" />
                  <Text style={styles.addBtnText}>Add Hotspot</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                setShowAddModal(false);
                setSelectedLocation(null);
                setZoneName('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: '#1E1E2E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {},
  headerGradient: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    lineHeight: 20,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(30,30,46,0.9)',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
  },
  suggestionsTitle: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  suggestionName: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSection: {
    padding: 20,
    paddingBottom: 10,
  },
  zoneCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: 'rgba(255,107,107,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  zoneCountText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#A0AEC0',
    fontSize: 15,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  myLocationBtn: {
    position: 'absolute',
    right: 20,
    top: -70,
    backgroundColor: 'rgba(30,30,46,0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#A0AEC0',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  radiusChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radiusChipActive: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderColor: '#FF6B6B',
  },
  radiusText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
  },
  radiusTextActive: {
    color: '#FF6B6B',
  },
  addBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    padding: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#A0AEC0',
    fontSize: 15,
  },
});
