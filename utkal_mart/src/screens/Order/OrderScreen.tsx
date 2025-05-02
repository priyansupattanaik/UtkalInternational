import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ImageBackground,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useNavigation} from '@react-navigation/native';

const orders = [
  {id: '1', title: 'Corn', date: '2024-05-15'},
  {id: '2', title: 'Red chilli', date: '2023-08-22'},
  {id: '3', title: 'Turmeric', date: '2024-01-10'},
  {id: '4', title: 'Black pepper', date: '2022-12-30'},
  {id: '5', title: 'Coffee', date: '2023-06-11'},
];

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const years = ['2024', '2023', '2022'];

  // Filter orders based on search term and selected year
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear
      ? order.date.startsWith(selectedYear)
      : true;
    return matchesSearch && matchesYear;
  });

  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/bg1.png')}
      style={styles.container}
      resizeMode="cover">
      <View style={styles.innerContainer}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('ProfileScreen')}>
          <Image
            source={require('../../assets/images/pageicons/back_button.png')} // Replace with your back icon path
            style={styles.backIcon}
          />
        </TouchableOpacity>
        {/* Search and Filter Row */}
        <View style={styles.searchFilterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Orders"
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.filterButton}>
            <Icon name="filter" size={20} color="white" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
        {/* Filter Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter by Year</Text>
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  onPress={() => {
                    setSelectedYear(year);
                    setModalVisible(false);
                  }}>
                  <Text style={styles.yearText}>{year}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setSelectedYear(null);
                  setModalVisible(false);
                }}>
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Order List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderTitle}>{item.title}</Text>
              <Text style={styles.orderDate}>{item.date}</Text>
            </View>
          )}
        />
        {/* No orders message */}
        {filteredOrders.length === 0 && (
          <Text style={styles.noOrdersText}>No orders found.</Text>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 1,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: 'white', // Adjust color as needed
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between search input and filter button
    marginBottom: 40,
    marginTop: 40,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    marginRight: 10, // Add some space between search input and filter button
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b6ef6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: -16,
  },
  orderCard: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTitle: {fontSize: 16, fontWeight: 'bold', color: '#333'},
  orderDate: {fontSize: 14, color: '#666', marginTop: 5},
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 250,
    alignItems: 'center',
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  yearText: {fontSize: 16, marginVertical: 5, color: '#333'},
  clearFilterText: {fontSize: 16, color: 'red', marginTop: 10},
});
