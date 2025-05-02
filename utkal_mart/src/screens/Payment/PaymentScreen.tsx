import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  ScrollView,
} from 'react-native';
import {useTheme} from '../../utils/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Image} from 'react-native-elements';

export default function PaymentScreen() {
  const {isWhiteMode} = useTheme();
  const [selectedMethod, setSelectedMethod] = useState('Credit/Debit Card');

  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/bg1.png')}
      style={styles.container}
      resizeMode="cover">
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('ProfileScreen')}>
        <Image
          source={require('../../assets/images/pageicons/back_button.png')} // Replace with your back icon path
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={[styles.header, isWhiteMode && styles.headerDark]}>
          Payment Methods
        </Text>

        {/* Payment Options */}
        <TouchableOpacity
          style={[
            styles.option,
            selectedMethod === 'COD' && styles.selectedOption,
          ]}
          onPress={() => setSelectedMethod('COD')}>
          <Icon
            name="money"
            size={18}
            color={selectedMethod === 'COD' ? '#fff' : '#333'}
          />
          <Text
            style={[
              styles.optionText,
              selectedMethod === 'COD' && styles.optionTextSelected,
            ]}>
            Cash on Delivery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedMethod === 'Credit/Debit Card' && styles.selectedOption,
          ]}
          onPress={() => setSelectedMethod('Credit/Debit Card')}>
          <Icon
            name="credit-card"
            size={18}
            color={selectedMethod === 'Credit/Debit Card' ? '#fff' : '#333'}
          />
          <Text
            style={[
              styles.optionText,
              selectedMethod === 'Credit/Debit Card' &&
                styles.optionTextSelected,
            ]}>
            Credit/Debit Card
          </Text>
        </TouchableOpacity>

        {selectedMethod === 'Credit/Debit Card' && (
          <View style={styles.cardContainer}>
            <TextInput
              placeholder="Cardholder Name"
              style={styles.input}
              placeholderTextColor="#333"
            />
            <TextInput
              placeholder="Card Number"
              style={styles.input}
              placeholderTextColor="#333"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Expiry Date"
                style={[styles.input, styles.halfInput]}
                placeholderTextColor="#333"
              />
              <TextInput
                placeholder="CVV"
                style={[styles.input, styles.halfInput]}
                placeholderTextColor="#333"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Pay Now Button */}
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  innerContainer: {
    padding: 20,
    paddingTop: 0, // Remove top padding to start content from the top
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    marginTop: 70,
  },
  headerDark: {color: '#333'},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  selectedOption: {backgroundColor: '#8b6ef6'},
  optionText: {fontSize: 16, marginLeft: 10, color: '#333'},
  optionTextSelected: {color: '#fff'},
  cardContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    color: '#333',
  },
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  halfInput: {width: '48%'},
  payButton: {
    backgroundColor: '#8b6ef6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {color: 'white', fontSize: 18, fontWeight: 'bold'},
});
