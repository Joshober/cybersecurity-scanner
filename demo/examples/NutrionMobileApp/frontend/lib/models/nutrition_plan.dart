class NutritionPlan {
  final int? id;
  final String name;
  final String? description;
  final String? age;
  final String? sex;
  final String? height;
  final String? weight;
  final String? formulaWritten;
  final String? factorName;
  final String? factorValue;
  final String? dailyCalories;
  final String? carbohydratesG;
  final String? proteinsG;
  final String? fatsG;
  final String? hydration;
  final String? boronMg;
  final String? calciumMg;
  final String? ironMg;
  final String? seleniumUg;
  final String? zincMg;
  final String? sodiumMg;

  NutritionPlan({
    this.id,
    required this.name,
    this.description,
    this.age,
    this.sex,
    this.height,
    this.weight,
    this.formulaWritten,
    this.factorName,
    this.factorValue,
    this.dailyCalories,
    this.carbohydratesG,
    this.proteinsG,
    this.fatsG,
    this.hydration,
    this.boronMg,
    this.calciumMg,
    this.ironMg,
    this.seleniumUg,
    this.zincMg,
    this.sodiumMg,
  });

  factory NutritionPlan.fromJson(Map<String, dynamic> json) {
    return NutritionPlan(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      age: json['age'],
      sex: json['sex'],
      height: json['height'],
      weight: json['weight'],
      formulaWritten: json['formulaWritten'],
      factorName: json['factorName'],
      factorValue: json['factorValue'],
      dailyCalories: json['dailyCalories'],
      carbohydratesG: json['carbohydratesG'],
      proteinsG: json['proteinsG'],
      fatsG: json['fatsG'],
      hydration: json['hydration'],
      boronMg: json['boronMg'],
      calciumMg: json['calciumMg'],
      ironMg: json['ironMg'],
      seleniumUg: json['seleniumUg'],
      zincMg: json['zincMg'],
      sodiumMg: json['sodiumMg'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'age': age,
      'sex': sex,
      'height': height,
      'weight': weight,
      'formulaWritten': formulaWritten,
      'factorName': factorName,
      'factorValue': factorValue,
      'dailyCalories': dailyCalories,
      'carbohydratesG': carbohydratesG,
      'proteinsG': proteinsG,
      'fatsG': fatsG,
      'hydration': hydration,
      'boronMg': boronMg,
      'calciumMg': calciumMg,
      'ironMg': ironMg,
      'seleniumUg': seleniumUg,
      'zincMg': zincMg,
      'sodiumMg': sodiumMg,
    };
  }
}
