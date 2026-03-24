class NutritionCalculationRequest {
  final String? sex;
  final double? weight;
  final double? height;
  final int? age;
  final String? activityLevel;
  final String? factorValue;

  NutritionCalculationRequest({
    this.sex,
    this.weight,
    this.height,
    this.age,
    this.activityLevel,
    this.factorValue,
  });

  Map<String, dynamic> toJson() {
    return {
      'sex': sex,
      'weight': weight,
      'height': height,
      'age': age,
      'activityLevel': activityLevel,
      'factorValue': factorValue,
    };
  }
}

class NutritionCalculationResponse {
  final int? bmr;
  final int? dailyCalories;
  final double? activityFactor;
  final int? carbohydratesG;
  final int? proteinsG;
  final int? fatsG;

  NutritionCalculationResponse({
    this.bmr,
    this.dailyCalories,
    this.activityFactor,
    this.carbohydratesG,
    this.proteinsG,
    this.fatsG,
  });

  factory NutritionCalculationResponse.fromJson(Map<String, dynamic> json) {
    return NutritionCalculationResponse(
      bmr: json['bmr'],
      dailyCalories: json['dailyCalories'],
      activityFactor: json['activityFactor']?.toDouble(),
      carbohydratesG: json['carbohydratesG'],
      proteinsG: json['proteinsG'],
      fatsG: json['fatsG'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bmr': bmr,
      'dailyCalories': dailyCalories,
      'activityFactor': activityFactor,
      'carbohydratesG': carbohydratesG,
      'proteinsG': proteinsG,
      'fatsG': fatsG,
    };
  }
}
