import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nutrition_app/widgets/custom_button.dart';

void main() {
  group('CustomButton', () {
    testWidgets('should display button with correct text',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      expect(find.text(buttonText), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('should call onPressed when tapped',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      bool buttonPressed = false;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {
                buttonPressed = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      // Then
      expect(buttonPressed, isTrue);
    });

    testWidgets('should not call onPressed when button is disabled',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      bool buttonPressed = false;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: null, // Button is disabled
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      // Then
      expect(buttonPressed, isFalse);
    });

    testWidgets('should show loading indicator when isLoading is true',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              isLoading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text(buttonText), findsNothing);
    });

    testWidgets('should not show loading indicator when isLoading is false',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              isLoading: false,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      expect(find.byType(CircularProgressIndicator), findsNothing);
      expect(find.text(buttonText), findsOneWidget);
    });

    testWidgets('should use custom background color when provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      const customColor = Colors.red;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              backgroundColor: customColor,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final ElevatedButton button = tester.widget(find.byType(ElevatedButton));
      expect(button.style?.backgroundColor?.resolve({}), equals(customColor));
    });

    testWidgets('should use custom text color when provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      const customColor = Colors.blue;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              textColor: customColor,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final ElevatedButton button = tester.widget(find.byType(ElevatedButton));
      expect(button.style?.foregroundColor?.resolve({}), equals(customColor));
    });

    testWidgets('should use custom width when provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      const customWidth = 200.0;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              width: customWidth,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final SizedBox sizedBox = tester.widget(find.byType(SizedBox));
      expect(sizedBox.width, equals(customWidth));
    });

    testWidgets('should use custom height when provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';
      const customHeight = 60.0;

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              height: customHeight,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final SizedBox sizedBox = tester.widget(find.byType(SizedBox));
      expect(sizedBox.height, equals(customHeight));
    });

    testWidgets('should use default width when not provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final SizedBox sizedBox = tester.widget(find.byType(SizedBox));
      expect(sizedBox.width, equals(double.infinity));
    });

    testWidgets('should use default height when not provided',
        (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final SizedBox sizedBox = tester.widget(find.byType(SizedBox));
      expect(sizedBox.height, equals(48.0));
    });

    testWidgets('should have rounded corners', (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final ElevatedButton button = tester.widget(find.byType(ElevatedButton));
      final OutlinedBorder? shape = button.style?.shape?.resolve({});
      if (shape is RoundedRectangleBorder) {
        expect(shape.borderRadius, equals(BorderRadius.circular(8)));
      } else {
        fail('Expected RoundedRectangleBorder but got ${shape.runtimeType}');
      }
    });

    testWidgets('should have correct text style', (WidgetTester tester) async {
      // Given
      const buttonText = 'Test Button';

      // When
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Then
      final Text textWidget = tester.widget(find.text(buttonText));
      expect(textWidget.style?.fontSize, equals(16.0));
      expect(textWidget.style?.fontWeight, equals(FontWeight.w600));
    });
  });
}
