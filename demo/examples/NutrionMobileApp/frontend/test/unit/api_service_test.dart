import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:nutrition_app/services/api_service.dart';
import '../fixtures/test_data.dart';

import 'api_service_test.mocks.dart';

@GenerateMocks([http.Client])
void main() {
  group('ApiService', () {
    late MockClient mockClient;

    setUp(() {
      mockClient = MockClient();
    });

    group('login', () {
      test('should return user data when login is successful', () async {
        // Given
        const username = 'testuser';
        const password = 'password123';
        final expectedResponse = {
          'token': 'test-token',
          'user': {
            'id': 1,
            'username': 'testuser',
            'email': 'test@example.com',
            'age': 25,
            'weight': 70.0,
            'height': 175.0,
            'activityLevel': 'moderate',
            'vegan': false,
            'vegetarian': false,
          }
        };

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              jsonEncode(expectedResponse),
              200,
            ));

        // When
        final result = await ApiService.login(username, password);

        // Then
        expect(result, equals(expectedResponse));
        verify(mockClient.post(
          Uri.parse('${ApiService.getBaseUrl()}/auth/login'),
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'username': username,
            'password': password,
          }),
        )).called(1);
      });

      test('should throw exception when login fails', () async {
        // Given
        const username = 'testuser';
        const password = 'wrongpassword';

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              '{"error": "Invalid credentials"}',
              401,
            ));

        // When & Then
        expect(
          () => ApiService.login(username, password),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('register', () {
      test('should return user data when registration is successful', () async {
        // Given
        final user = TestData.createTestUser();
        final expectedResponse = {
          'message': 'User registered successfully',
          'user': {
            'id': 1,
            'username': 'testuser',
            'email': 'test@example.com',
            'age': 25,
            'weight': 70.0,
            'height': 175.0,
            'activityLevel': 'moderate',
            'vegan': false,
            'vegetarian': false,
          }
        };

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              jsonEncode(expectedResponse),
              201,
            ));

        // When
        final result = await ApiService.register(user.toJson());

        // Then
        expect(result, equals(expectedResponse));
        verify(mockClient.post(
          Uri.parse('${ApiService.getBaseUrl()}/auth/register'),
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonEncode(user.toJson()),
        )).called(1);
      });

      test('should throw exception when registration fails', () async {
        // Given
        final user = TestData.createTestUser();

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              '{"error": "Username already exists"}',
              400,
            ));

        // When & Then
        expect(
          () => ApiService.register(user.toJson()),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getDiningHallMenu', () {
      test('should return dining hall menu when request is successful',
          () async {
        // Given
        const locationId = '48760001';
        const date = '2024-01-15';
        final expectedResponse = {
          'success': true,
          'locationId': locationId,
          'date': date,
          'menuItems': [
            {
              'id': 1,
              'name': 'Scrambled Eggs',
              'description': 'Fresh scrambled eggs',
              'category': 'Breakfast',
              'location': locationId,
              'date': date,
              'mealType': 'breakfast',
            }
          ],
          'itemCount': 1,
        };

        when(mockClient.get(
          any,
          headers: anyNamed('headers'),
        )).thenAnswer((_) async => http.Response(
              jsonEncode(expectedResponse),
              200,
            ));

        // When
        final result = await ApiService.getDiningHallMenu(
          locationId: locationId,
          date: date,
        );

        // Then
        expect(result.locationId, equals(locationId));
        expect(result.date, equals(date));
        expect(result.categories, hasLength(1));
        expect(result.categories.first.items, hasLength(1));
        expect(
            result.categories.first.items.first.name, equals('Scrambled Eggs'));

        verify(mockClient.get(
          Uri.parse(
              '${ApiService.getBaseUrl()}/menu/sodexo/$locationId?date=$date'),
          headers: {
            'Content-Type': 'application/json',
          },
        )).called(1);
      });

      test('should throw exception when request fails', () async {
        // Given
        const locationId = '48760001';
        const date = '2024-01-15';

        when(mockClient.get(
          any,
          headers: anyNamed('headers'),
        )).thenAnswer((_) async => http.Response(
              '{"error": "Location not found"}',
              404,
            ));

        // When & Then
        expect(
          () => ApiService.getDiningHallMenu(
            locationId: locationId,
            date: date,
          ),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getAllNutritionPlans', () {
      test('should return nutrition plans when request is successful',
          () async {
        // Given
        final expectedResponse = [
          {
            'id': 1,
            'name': 'Test Plan',
            'description': 'A test plan',
            'age': '25',
            'sex': 'male',
            'height': '175.0',
            'weight': '70.0',
            'dailyCalories': '2000',
            'carbohydratesG': '250',
            'proteinsG': '150',
            'fatsG': '65',
          }
        ];

        when(mockClient.get(
          any,
          headers: anyNamed('headers'),
        )).thenAnswer((_) async => http.Response(
              jsonEncode(expectedResponse),
              200,
            ));

        // When
        final result = await ApiService.getAllNutritionPlans();

        // Then
        expect(result, hasLength(1));
        expect(result.first.name, equals('Test Plan'));
        expect(result.first.dailyCalories, equals('2000'));

        verify(mockClient.get(
          Uri.parse('${ApiService.getBaseUrl()}/nutrition/plans'),
          headers: {
            'Content-Type': 'application/json',
          },
        )).called(1);
      });

      test('should throw exception when request fails', () async {
        // Given
        when(mockClient.get(
          any,
          headers: anyNamed('headers'),
        )).thenAnswer((_) async => http.Response(
              '{"error": "Server error"}',
              500,
            ));

        // When & Then
        expect(
          () => ApiService.getAllNutritionPlans(),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('calculateNutrition', () {
      test('should return nutrition calculation when request is successful',
          () async {
        // Given
        final request = TestData.createTestNutritionCalculationRequest();
        final expectedResponse = {
          'bmr': 1500,
          'dailyCalories': 2250,
          'activityFactor': 1.5,
          'carbohydratesG': 280,
          'proteinsG': 140,
          'fatsG': 75,
        };

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              jsonEncode(expectedResponse),
              200,
            ));

        // When
        final result = await ApiService.calculateNutrition(request);

        // Then
        expect(result.bmr, equals(1500));
        expect(result.dailyCalories, equals(2250));
        expect(result.carbohydratesG, equals(280));
        expect(result.proteinsG, equals(140));

        verify(mockClient.post(
          Uri.parse('${ApiService.getBaseUrl()}/nutrition/calculate'),
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonEncode(request.toJson()),
        )).called(1);
      });

      test('should throw exception when request fails', () async {
        // Given
        final request = TestData.createTestNutritionCalculationRequest();

        when(mockClient.post(
          any,
          headers: anyNamed('headers'),
          body: anyNamed('body'),
        )).thenAnswer((_) async => http.Response(
              '{"error": "Invalid request"}',
              400,
            ));

        // When & Then
        expect(
          () => ApiService.calculateNutrition(request),
          throwsA(isA<Exception>()),
        );
      });
    });
  });
}
