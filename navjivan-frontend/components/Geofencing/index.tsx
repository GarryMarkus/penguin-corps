import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import {
    addGeofenceZone,
    GeofenceZone,
    getCurrentLocation,
    getGeofenceZones,
    isGeofencingActive,
    isIdleDetectionActive,
    removeGeofenceZone,
    requestPermissions,
    startGeofencing,
    startIdleDetection,
    stopGeofencing,
    stopIdleDetection,
} from '../../services/geofencing';

const { width, height } = Dimensions.get('window');

export default function GeofencingNative() {

    const { user } = useContext(AuthContext);
    const isSmoker = user?.isSmoker ?? false;

    const [zones, setZones] = useState<GeofenceZone[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);


    const [isIdleDetectionOn, setIsIdleDetectionOn] = useState(false);


    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneType, setNewZoneType] = useState<'trigger' | 'safe'>('trigger');
    const [newZoneRadius, setNewZoneRadius] = useState('100');
    const [notifyOnEnter, setNotifyOnEnter] = useState(true);
    const [notifyOnExit, setNotifyOnExit] = useState(true);


    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Location.LocationGeocodedAddress[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedSearchResult, setSelectedSearchResult] = useState<string>('');

    const mapRef = useRef<MapView>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await initializeGeofencing();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        initializeGeofencing();
    }, []);

    const initializeGeofencing = async () => {

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            Alert.alert(
                'Permissions Required',
                'Location and notification permissions are required for geofencing to work.',
                [{ text: 'OK' }]
            );
            return;
        }


        const location = await getCurrentLocation();
        setCurrentLocation(location);


        const savedZones = await getGeofenceZones();
        setZones(savedZones);


        const active = await isGeofencingActive();
        setIsActive(active);


        const idleActive = await isIdleDetectionActive();
        setIsIdleDetectionOn(idleActive);


        if (savedZones.length > 0 && !active) {
            await startGeofencing();
            setIsActive(true);
        }
    };

    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        setShowAddModal(true);
    };

    const handleAddZone = async () => {
        if (!selectedLocation) return;
        if (!newZoneName.trim()) {
            Alert.alert('Error', 'Please enter a zone name');
            return;
        }

        const radius = parseInt(newZoneRadius);
        if (isNaN(radius) || radius < 50 || radius > 1000) {
            Alert.alert('Error', 'Radius must be between 50 and 1000 meters');
            return;
        }

        const newZone: GeofenceZone = {
            id: `zone_${Date.now()}`,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            radius,
            name: newZoneName,
            type: newZoneType,
            notifyOnEnter,
            notifyOnExit,
        };

        try {
            await addGeofenceZone(newZone);
            const updatedZones = await getGeofenceZones();
            setZones(updatedZones);
            setShowAddModal(false);
            resetForm();
            Alert.alert('Success', `${newZoneType === 'trigger' ? 'Trigger' : 'Safe'} zone added successfully!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to add zone. Please try again.');
        }
    };

    const handleDeleteZone = (zoneId: string) => {
        Alert.alert(
            'Delete Zone',
            'Are you sure you want to delete this zone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeGeofenceZone(zoneId);
                            const updatedZones = await getGeofenceZones();
                            setZones(updatedZones);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete zone');
                        }
                    },
                },
            ]
        );
    };

    const toggleGeofencing = async () => {
        try {
            if (isActive) {
                await stopGeofencing();
                setIsActive(false);
                Alert.alert('Geofencing Disabled', 'You will no longer receive location-based alerts');
            } else {
                if (zones.length === 0) {
                    Alert.alert('No Zones', 'Please add at least one zone before enabling geofencing');
                    return;
                }
                await startGeofencing();
                setIsActive(true);
                Alert.alert('Geofencing Enabled', 'You will now receive alerts when entering/exiting zones');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to toggle geofencing');
        }
    };


    const toggleIdleDetection = async () => {
        try {
            if (isIdleDetectionOn) {
                await stopIdleDetection();
                setIsIdleDetectionOn(false);
                Alert.alert('Activity Monitor Disabled', 'You will no longer receive idle alerts');
            } else {
                await startIdleDetection();
                setIsIdleDetectionOn(true);
                Alert.alert('Activity Monitor Enabled', 'You will receive alerts when stationary for too long (daytime only)');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to toggle activity monitor');
        }
    };

    const resetForm = () => {
        setNewZoneName('');
        setNewZoneType('trigger');
        setNewZoneRadius('100');
        setNotifyOnEnter(true);
        setNotifyOnExit(true);
        setSelectedLocation(null);
    };

    const centerOnLocation = async () => {
        const location = await getCurrentLocation();
        if (location && mapRef.current) {
            setCurrentLocation(location);
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };


    const searchLocation = async (query: string) => {
        if (query.trim().length < 3) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {

            const results = await Location.geocodeAsync(query);

            if (results.length > 0) {

                const addressPromises = results.slice(0, 5).map(async (result) => {
                    const addresses = await Location.reverseGeocodeAsync({
                        latitude: result.latitude,
                        longitude: result.longitude,
                    });
                    return {
                        ...addresses[0],
                        latitude: result.latitude,
                        longitude: result.longitude,
                    };
                });

                const addresses = await Promise.all(addressPromises);
                setSearchResults(addresses as any);
                setShowSearchResults(true);
            } else {
                setSearchResults([]);
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Search Error', 'Could not search for locations. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };


    const handleSearchChange = (text: string) => {
        setSearchQuery(text);


        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }


        searchTimeoutRef.current = setTimeout(() => {
            searchLocation(text);
        }, 500);
    };


    const handleSelectSearchResult = (result: any) => {
        Keyboard.dismiss();
        setShowSearchResults(false);


        const addressParts = [];
        if (result.name) addressParts.push(result.name);
        if (result.street) addressParts.push(result.street);
        if (result.city) addressParts.push(result.city);

        const formattedAddress = addressParts.length > 0
            ? addressParts.join(', ')
            : searchQuery;

        setSelectedSearchResult(formattedAddress);
        setNewZoneName(formattedAddress);


        const coordinate = {
            latitude: result.latitude,
            longitude: result.longitude,
        };

        setSelectedLocation(coordinate);

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: result.latitude,
                longitude: result.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }


        setSearchQuery('');
        setSearchResults([]);


        setShowAddModal(true);
    };


    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        Keyboard.dismiss();
    };


    const formatSearchResult = (result: any) => {
        const parts = [];
        if (result.name) parts.push(result.name);
        if (result.street) parts.push(result.street);
        if (result.city) parts.push(result.city);
        if (result.region) parts.push(result.region);
        if (result.country) parts.push(result.country);
        return parts.join(', ') || 'Unknown location';
    };

    const initialRegion: Region = currentLocation
        ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }
        : {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

    return (
        <SafeAreaView style={styles.container}>
            {}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {isSmoker ? 'Geofencing' : 'Activity Monitor'}
                </Text>
                <View style={styles.headerRight}>
                    {}
                    <TouchableOpacity onPress={toggleIdleDetection} style={styles.toggleButton}>
                        <Ionicons
                            name={isIdleDetectionOn ? 'fitness' : 'fitness-outline'}
                            size={24}
                            color={isIdleDetectionOn ? LPColors.primary : LPColors.textGray}
                        />
                    </TouchableOpacity>
                    {}
                    {isSmoker && (
                        <TouchableOpacity onPress={toggleGeofencing} style={styles.toggleButton}>
                            <Ionicons
                                name={isActive ? 'notifications' : 'notifications-off'}
                                size={24}
                                color={isActive ? LPColors.primary : LPColors.textGray}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {}
            <View style={[styles.statusBar, isIdleDetectionOn ? styles.statusActive : styles.statusInactive]}>
                <Ionicons
                    name={isIdleDetectionOn ? 'fitness' : 'body-outline'}
                    size={20}
                    color={isIdleDetectionOn ? LPColors.primary : '#FF6B6B'}
                />
                <Text style={styles.statusText}>
                    {isIdleDetectionOn ? 'Activity Monitor Active' : 'Activity Monitor Off'}
                </Text>
                <Text style={styles.zoneCount}>Daytime only</Text>
            </View>

            {}
            {isSmoker && (
                <View style={[styles.statusBar, isActive ? styles.statusActive : styles.statusInactive, { marginTop: 4 }]}>
                    <Ionicons
                        name={isActive ? 'checkmark-circle' : 'alert-circle'}
                        size={20}
                        color={isActive ? LPColors.primary : '#FF6B6B'}
                    />
                    <Text style={styles.statusText}>
                        {isActive ? 'Geofencing Active' : 'Geofencing Disabled'}
                    </Text>
                    <Text style={styles.zoneCount}>{zones.length} zones</Text>
                </View>
            )}

            {}
            {isSmoker && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color={LPColors.textGray} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a location..."
                            placeholderTextColor={LPColors.textGray}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            returnKeyType="search"
                            onSubmitEditing={() => searchLocation(searchQuery)}
                        />
                        {isSearching && (
                            <ActivityIndicator size="small" color={LPColors.primary} style={styles.searchLoader} />
                        )}
                        {searchQuery.length > 0 && !isSearching && (
                            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={20} color={LPColors.textGray} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {}
                    {showSearchResults && (
                        <View style={styles.searchResultsContainer}>
                            {searchResults.length === 0 ? (
                                <View style={styles.noResultsContainer}>
                                    <Ionicons name="location-outline" size={24} color={LPColors.textGray} />
                                    <Text style={styles.noResultsText}>No locations found</Text>
                                    <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(_item: any, index: number) => `search-${index}`}
                                    keyboardShouldPersistTaps="handled"
                                    style={styles.searchResultsList}
                                    renderItem={({ item }: { item: any }) => (
                                        <TouchableOpacity
                                            style={styles.searchResultItem}
                                            onPress={() => handleSelectSearchResult(item)}
                                        >
                                            <Ionicons name="location" size={20} color={LPColors.primary} />
                                            <View style={styles.searchResultTextContainer}>
                                                <Text style={styles.searchResultText} numberOfLines={1}>
                                                    {formatSearchResult(item)}
                                                </Text>
                                                <Text style={styles.searchResultSubtext} numberOfLines={1}>
                                                    {item.city || item.region || item.country || 'Tap to add zone'}
                                                </Text>
                                            </View>
                                            <Ionicons name="add-circle-outline" size={20} color={LPColors.primary} />
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    )}
                </View>
            )}

            {}
            {isSmoker ? (
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        onPress={handleMapPress}
                        showsUserLocation
                        showsMyLocationButton={false}
                        customMapStyle={darkMapStyle}
                    >
                        {}
                        {zones.map((zone) => (
                            <React.Fragment key={zone.id}>
                                <Circle
                                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                                    radius={zone.radius}
                                    fillColor={zone.type === 'trigger' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(191, 239, 224, 0.2)'}
                                    strokeColor={zone.type === 'trigger' ? '#FF6B6B' : '#BFEFE0'}
                                    strokeWidth={2}
                                />
                                <Marker
                                    coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                                    title={zone.name}
                                    description={`${zone.type === 'trigger' ? 'Trigger' : 'Safe'} Zone - ${zone.radius}m`}
                                    onCalloutPress={() => handleDeleteZone(zone.id)}
                                >
                                    <View style={[styles.markerContainer, zone.type === 'trigger' ? styles.triggerMarker : styles.safeMarker]}>
                                        <Ionicons
                                            name={zone.type === 'trigger' ? 'warning' : 'shield-checkmark'}
                                            size={24}
                                            color={LPColors.text}
                                        />
                                    </View>
                                </Marker>
                            </React.Fragment>
                        ))}

                        {}
                        {selectedLocation && (
                            <Marker coordinate={selectedLocation} pinColor={LPColors.primary} />
                        )}
                    </MapView>

                    {}
                    <TouchableOpacity style={styles.locationButton} onPress={centerOnLocation}>
                        <Ionicons name="locate" size={24} color={LPColors.text} />
                    </TouchableOpacity>
                </View>
            ) : (
                
                <View style={styles.nonSmokerContent}>
                    <View style={styles.activityInfoCard}>
                        <Ionicons name="fitness" size={64} color={LPColors.primary} />
                        <Text style={styles.activityInfoTitle}>Activity Monitor</Text>
                        <Text style={styles.activityInfoText}>
                            When enabled, you&apos;ll receive alerts if you stay in one place for too long.
                        </Text>
                        <View style={styles.activityFeatureList}>
                            <View style={styles.activityFeatureItem}>
                                <Ionicons name="time-outline" size={20} color={LPColors.primary} />
                                <Text style={styles.activityFeatureText}>Alerts after 30 seconds of inactivity</Text>
                            </View>
                            <View style={styles.activityFeatureItem}>
                                <Ionicons name="sunny-outline" size={20} color={LPColors.primary} />
                                <Text style={styles.activityFeatureText}>Active during daytime only (6 AM - 10 PM)</Text>
                            </View>
                            <View style={styles.activityFeatureItem}>
                                <Ionicons name="notifications-outline" size={20} color={LPColors.primary} />
                                <Text style={styles.activityFeatureText}>Get reminded to move and stay active</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.activityToggleButton, isIdleDetectionOn && styles.activityToggleButtonActive]}
                            onPress={toggleIdleDetection}
                        >
                            <Ionicons
                                name={isIdleDetectionOn ? 'pause-circle' : 'play-circle'}
                                size={24}
                                color={isIdleDetectionOn ? '#000' : LPColors.text}
                            />
                            <Text style={[styles.activityToggleText, isIdleDetectionOn && styles.activityToggleTextActive]}>
                                {isIdleDetectionOn ? 'Disable Activity Monitor' : 'Enable Activity Monitor'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {}
            {isSmoker && (
                <>
                    {}
                    <View style={styles.instructions}>
                        <Ionicons name="information-circle" size={20} color={LPColors.textGray} />
                        <Text style={styles.instructionsText}>
                            Search or tap on the map to add a new zone
                        </Text>
                    </View>

                    {}
                    <ScrollView
                        style={styles.zoneList}
                        contentContainerStyle={styles.zoneListContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={LPColors.primary}
                                colors={[LPColors.primary]}
                            />
                        }
                    >
                        {zones.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="map-outline" size={48} color="#444" />
                                <Text style={styles.emptyText}>No zones added yet</Text>
                                <Text style={styles.emptySubtext}>Tap on the map to create your first zone</Text>
                            </View>
                        ) : (
                            zones.map((zone) => (
                                <View key={zone.id} style={styles.zoneCard}>
                                    <View style={styles.zoneHeader}>
                                        <View style={[styles.zoneIcon, zone.type === 'trigger' ? styles.triggerIcon : styles.safeIcon]}>
                                            <Ionicons
                                                name={zone.type === 'trigger' ? 'warning' : 'shield-checkmark'}
                                                size={20}
                                                color={LPColors.text}
                                            />
                                        </View>
                                        <View style={styles.zoneInfo}>
                                            <Text style={styles.zoneName}>{zone.name}</Text>
                                            <Text style={styles.zoneDetails}>
                                                {zone.type === 'trigger' ? 'Trigger Zone' : 'Safe Zone'} • {zone.radius}m radius
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteZone(zone.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.zoneNotifications}>
                                        <Text style={styles.notificationText}>
                                            {zone.notifyOnEnter && 'Enter'}
                                            {zone.notifyOnEnter && zone.notifyOnExit && ' • '}
                                            {zone.notifyOnExit && 'Exit'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {}
                    <Modal
                        visible={showAddModal}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => {
                            setShowAddModal(false);
                            resetForm();
                        }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Add New Zone</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowAddModal(false);
                                            resetForm();
                                        }}
                                    >
                                        <Ionicons name="close" size={28} color={LPColors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalForm}>
                                    {}
                                    <Text style={styles.label}>Zone Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newZoneName}
                                        onChangeText={setNewZoneName}
                                        placeholder="e.g., Local Bar, Park, Home"
                                        placeholderTextColor="#666"
                                    />

                                    {}
                                    <Text style={styles.label}>Zone Type</Text>
                                    <View style={styles.typeSelector}>
                                        <TouchableOpacity
                                            style={[styles.typeButton, newZoneType === 'trigger' && styles.typeButtonActive]}
                                            onPress={() => setNewZoneType('trigger')}
                                        >
                                            <Ionicons name="warning" size={24} color={newZoneType === 'trigger' ? LPColors.text : LPColors.textGray} />
                                            <Text style={[styles.typeButtonText, newZoneType === 'trigger' && styles.typeButtonTextActive]}>
                                                Trigger Zone
                                            </Text>
                                            <Text style={styles.typeDescription}>High-risk location</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeButton, newZoneType === 'safe' && styles.typeButtonActive]}
                                            onPress={() => setNewZoneType('safe')}
                                        >
                                            <Ionicons name="shield-checkmark" size={24} color={newZoneType === 'safe' ? LPColors.text : LPColors.textGray} />
                                            <Text style={[styles.typeButtonText, newZoneType === 'safe' && styles.typeButtonTextActive]}>
                                                Safe Zone
                                            </Text>
                                            <Text style={styles.typeDescription}>Smoke-free area</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {}
                                    <Text style={styles.label}>Radius (meters)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newZoneRadius}
                                        onChangeText={setNewZoneRadius}
                                        placeholder="50-1000"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />

                                    {}
                                    <Text style={styles.label}>Notifications</Text>
                                    <View style={styles.switchRow}>
                                        <Text style={styles.switchLabel}>Notify on Enter</Text>
                                        <Switch
                                            value={notifyOnEnter}
                                            onValueChange={setNotifyOnEnter}
                                            trackColor={{ false: '#444', true: LPColors.primary }}
                                            thumbColor="#fff"
                                        />
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={styles.switchLabel}>Notify on Exit</Text>
                                        <Switch
                                            value={notifyOnExit}
                                            onValueChange={setNotifyOnExit}
                                            trackColor={{ false: '#444', true: LPColors.primary }}
                                            thumbColor="#fff"
                                        />
                                    </View>

                                    {}
                                    <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
                                        <Text style={styles.addButtonText}>Add Zone</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                </>
            )}
        </SafeAreaView>
    );
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }],
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }],
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }],
    },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LPColors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleButton: {
        padding: 8,
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    statusActive: {
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
    },
    statusInactive: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
    },
    statusText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.text,
    },
    zoneCount: {
        fontSize: 12,
        color: LPColors.textGray,
    },

    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        zIndex: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: LPColors.text,
        height: '100%',
    },
    searchLoader: {
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    searchResultsContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: LPColors.border,
        zIndex: 100,
    },
    searchResultsList: {
        maxHeight: 250,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: LPColors.border,
        gap: 12,
    },
    searchResultTextContainer: {
        flex: 1,
    },
    searchResultText: {
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.text,
    },
    searchResultSubtext: {
        fontSize: 12,
        color: LPColors.textGray,
        marginTop: 2,
    },
    noResultsContainer: {
        alignItems: 'center',
        padding: 24,
    },
    noResultsText: {
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.text,
        marginTop: 8,
    },
    noResultsSubtext: {
        fontSize: 12,
        color: LPColors.textGray,
        marginTop: 4,
    },
    mapContainer: {
        height: height * 0.4,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    locationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: LPColors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    triggerMarker: {
        backgroundColor: '#FF6B6B',
    },
    safeMarker: {
        backgroundColor: '#BFEFE0',
    },
    instructions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: LPColors.surface,
        gap: 8,
    },
    instructionsText: {
        fontSize: 14,
        color: LPColors.textGray,
    },
    zoneList: {
        flex: 1,
    },
    zoneListContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: LPColors.textMuted,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: LPColors.textMuted,
        marginTop: 8,
    },
    zoneCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    zoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    zoneIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    triggerIcon: {
        backgroundColor: '#FF6B6B',
    },
    safeIcon: {
        backgroundColor: '#BFEFE0',
    },
    zoneInfo: {
        flex: 1,
    },
    zoneName: {
        fontSize: 16,
        fontWeight: '600',
        color: LPColors.text,
        marginBottom: 4,
    },
    zoneDetails: {
        fontSize: 12,
        color: LPColors.textGray,
    },
    zoneNotifications: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: LPColors.border,
    },
    notificationText: {
        fontSize: 12,
        color: LPColors.textGray,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: LPColors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: LPColors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: LPColors.text,
    },
    modalForm: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.text,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: LPColors.text,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: LPColors.primary,
        backgroundColor: LPColors.surfaceLight,
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: LPColors.textGray,
        marginTop: 8,
    },
    typeButtonTextActive: {
        color: LPColors.text,
    },
    typeDescription: {
        fontSize: 11,
        color: LPColors.textGray,
        marginTop: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    switchLabel: {
        fontSize: 14,
        color: LPColors.text,
    },
    addButton: {
        backgroundColor: LPColors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },

    nonSmokerContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    activityInfoCard: {
        backgroundColor: LPColors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.2)',
    },
    activityInfoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LPColors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    activityInfoText: {
        fontSize: 14,
        color: LPColors.textGray,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    activityFeatureList: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    activityFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    activityFeatureText: {
        flex: 1,
        fontSize: 14,
        color: LPColors.text,
    },
    activityToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LPColors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        gap: 8,
        width: '100%',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activityToggleButtonActive: {
        backgroundColor: LPColors.primary,
        borderColor: LPColors.primary,
    },
    activityToggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: LPColors.text,
    },
    activityToggleTextActive: {
        color: '#000',
    },
});
