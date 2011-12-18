from django.db import models
__author__ = 'Aaron'

class FoodGroup(models.Model):
    description = models.CharField(max_length=60)

class LanguaLFactor(models.Model):
    code = models.CharField(max_length=5, unique=True, primary_key=True)
    description = models.CharField(max_length=140)

class FoodDescription(models.Model):
    food_group = models.ForeignKey(FoodGroup)
    long_desc = models.CharField(max_length=200)
    short_desc = models.CharField(max_length=60)
    common_names = models.CharField(max_length=100, null=True)
    manufacturer = models.CharField(max_length=65, null=True)
    survey = models.CharField(max_length=1, null=True)
    refuse_desc = models.CharField(max_length=135, null=True)
    refuse_percent = models.DecimalField(max_digits=4, decimal_places=2, null=True)
    scientific_name = models.CharField(max_length=65, null=True)
    n_factor = models.DecimalField(decimal_places=2, max_digits=6, null=True)
    protein_factor = models.DecimalField(decimal_places=2, max_digits=6, null=True)
    fat_factor = models.DecimalField(decimal_places=2, max_digits=6, null=True)
    carb_factor = models.DecimalField(decimal_places=2, max_digits=6, null=True)
    langual_factor = models.ManyToManyField(LanguaLFactor, null=True)

class NutrientDefinition(models.Model):
    units = models.CharField(max_length=7)
    tagname = models.CharField(max_length=20)
    description = models.CharField(max_length=60)
    num_decimals = models.IntegerField(max_length=1)
    SR_order = models.IntegerField(max_length=6)

class NutrientDataType(models.Model):
    description = models.CharField(max_length=60)

class Derivation(models.Model):
    code = models.CharField(max_length=4, primary_key=True, unique=True)
    description = models.CharField(max_length=120)

class Weights(models.Model):
    food = models.ForeignKey(FoodDescription)
    sequence = models.IntegerField(max_length=2)
    amount = models.DecimalField(max_digits=8, decimal_places=3)
    unit = models.CharField(max_length=80)
    grams = models.DecimalField(max_digits=8, decimal_places=1)
    num_data_points = models.IntegerField(max_length=3)
    standard_deviation = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        unique_together = ('food', 'sequence')

class DataSource(models.Model):
    code = models.CharField(max_length=6)
    authors = models.CharField(max_length=255, null=True)
    title = models.CharField(max_length=255, null=True)
    year = models.IntegerField(max_length=4, null=True)
    journal = models.CharField(max_length=135, null=True)
    vol_city = models.CharField(max_length=16, null=True)
    issue_state = models.CharField(max_length=5, null=True)
    start_page = models.IntegerField(blank=True, null=True)
    end_page = models.IntegerField(blank=True, null=True)

class NutrientDataSource(models.Model):
    food = models.ForeignKey(FoodDescription)
    nutrient = models.ForeignKey('NutrientData')
    data_source = models.ForeignKey(DataSource)


class NutrientData(models.Model):
    food = models.ForeignKey(FoodDescription, related_name='nutrients')
    number = models.IntegerField()
    value = models.DecimalField(max_digits=13, decimal_places=3)
    data_points = models.DecimalField(max_digits=5, decimal_places=0)
    std_error = models.DecimalField(max_digits=11, decimal_places=3, blank=True)
    type = models.ForeignKey(NutrientDataType)
    derivation = models.ForeignKey(Derivation, null=True, blank=True)
    ref_food = models.ForeignKey(FoodDescription, null=True, blank=True)
    added = models.CharField(max_length=1, blank=True)
    num_studies = models.IntegerField(max_length=2, blank=True)
    min = models.DecimalField(max_digits=13, decimal_places=3, blank=True)
    max = models.DecimalField(max_digits=13, decimal_places=3, blank=True)
    deg_freedom = models.IntegerField(max_length=2, blank=True)
    lower_error_bound = models.DecimalField(max_digits=13, decimal_places=3, blank=True)
    upper_error_bound = models.DecimalField(max_digits=13, decimal_places=3, blank=True)
    stat_comment = models.CharField(max_length=10, blank=True)
    last_modified = models.CharField(max_length=10, blank=True)
    confidence_code = models.CharField(max_length=1, blank=True)

class Footnote(models.Model):
    food = models.ForeignKey(FoodDescription)
    number = models.IntegerField(max_length=4)
    type = models.CharField(max_length=1)
    nutrient = models.ForeignKey(NutrientData, null=True, blank=True)
    note = models.TextField()