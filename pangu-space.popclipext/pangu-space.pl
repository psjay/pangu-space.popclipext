#!/usr/bin/perl
use strict;
use warnings;
use utf8;
use Encode qw(decode);

binmode STDOUT, ':encoding(UTF-8)';

my $CJK = '\x{2e80}-\x{2eff}\x{2f00}-\x{2fdf}\x{3040}-\x{309f}\x{30a0}-\x{30fa}\x{30fc}-\x{30ff}\x{3100}-\x{312f}\x{3200}-\x{32ff}\x{3400}-\x{4dbf}\x{4e00}-\x{9fff}\x{f900}-\x{faff}';
my $ANS = 'A-Za-z\x{0370}-\x{03ff}0-9';

sub convert_to_fullwidth {
	my ($symbols) = @_;
	$symbols =~ s/~+/～/g;
	$symbols =~ s/!+/！/g;
	$symbols =~ s/;+/；/g;
	$symbols =~ s/:+/：/g;
	$symbols =~ s/,+/，/g;
	$symbols =~ s/\.+/。/g;
	$symbols =~ s/\?+/？/g;
	$symbols =~ s/^\s+|\s+$//g;
	return $symbols;
}

sub spacing_text {
	my ($text) = @_;
	return $text if length($text) <= 1 || $text !~ /[$CJK]/;

	while ($text =~ /([$CJK])([ ]*(?:[\:]+|\.)[ ]*)([$CJK])/) {
		my $replacement = $1 . convert_to_fullwidth($2) . $3;
		$text =~ s/([$CJK])([ ]*(?:[\:]+|\.)[ ]*)([$CJK])/$replacement/;
	}

	while ($text =~ /([$CJK])[ ]*([~!;,\?]+)[ ]*/) {
		my $replacement = $1 . convert_to_fullwidth($2);
		$text =~ s/([$CJK])[ ]*([~!;,\?]+)[ ]*/$replacement/;
	}

	$text =~ s/([\.]{2,}|…)([$CJK])/$1 $2/g;
	$text =~ s/([$CJK]):([A-Z0-9\(\)])/$1：$2/g;

	$text =~ s/([$CJK])([`"\x{05f4}])/$1 $2/g;
	$text =~ s/([`"\x{05f4}])([$CJK])/$1 $2/g;
	$text =~ s/([`"\x{05f4}]+)(\s*)(.+?)(\s*)([`"\x{05f4}]+)/$1$3$5/g;

	$text =~ s/([$CJK])('[^s])/$1 $2/g;
	$text =~ s/(')([$CJK])/$1 $2/g;
	$text =~ s/([${CJK}A-Za-z0-9])( )('s)/$1$3/g;

	$text =~ s/([$CJK])(#)([$CJK]+)(#)([$CJK])/$1 $2$3$4 $5/g;
	$text =~ s/([$CJK])(#([^ ]))/$1 $2/g;
	$text =~ s/(([^ ])#)([$CJK])/$1 $3/g;

	$text =~ s/([$CJK])([\+\-\*\/=&\|<>])([A-Za-z0-9])/$1 $2 $3/g;
	$text =~ s/([A-Za-z0-9])([\+\-\*\/=&\|<>])([$CJK])/$1 $2 $3/g;

	$text =~ s/([\/]) ([a-z\-_.\/]+)/$1$2/g;
	$text =~ s/([\/\.])([A-Za-z\-_.\/]+) ([\/])/$1$2$3/g;

	$text =~ s/([$CJK])([\(\[\{<>\x{201c}])/$1 $2/g;
	$text =~ s/([\)\]\}<>\x{201d}])([$CJK])/$1 $2/g;
	$text =~ s/([\(\[\{<\x{201c}]+)(\s*)(.+?)(\s*)([\)\]\}>\x{201d}]+)/$1$3$5/g;
	$text =~ s/([A-Za-z0-9$CJK])[ ]*(\x{201c})([A-Za-z0-9$CJK\-_ ]+)(\x{201d})/$1 $2$3$4/g;
	$text =~ s/(\x{201c})([A-Za-z0-9$CJK\-_ ]+)(\x{201d})[ ]*([A-Za-z0-9$CJK])/$1$2$3 $4/g;

	$text =~ s/([A-Za-z0-9])([\(\[\{])/$1 $2/g;
	$text =~ s/([\)\]\}])([A-Za-z0-9])/$1 $2/g;

	$text =~ s/([$CJK])([$ANS\@\$\%\^\&\*\-\+\\=\|\/\x{00a1}-\x{00ff}\x{2150}-\x{218f}\x{2700}-\x{27bf}])/$1 $2/g;
	$text =~ s/([$ANS~!\$\%\^\&\*\-\+\\=\|;:,.\/\?\x{00a1}-\x{00ff}\x{2150}-\x{218f}\x{2700}-\x{27bf}])([$CJK])/$1 $2/g;

	$text =~ s/(%)([A-Za-z])/$1 $2/g;
	$text =~ s/[ ]*([\x{00b7}\x{2022}\x{2027}])[ ]*/・/g;
	$text =~ s/^\s+|\s+$//g;
	return $text;
}

sub url_decode {
	my ($text) = @_;
	$text =~ tr/+/ /;
	$text =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
	return decode('UTF-8', $text);
}

my $query = $ENV{'POPCLIP_URLENCODED_TEXT'};
die "POPCLIP_URLENCODED_TEXT is required\n" unless defined $query;

my $result = spacing_text(url_decode($query));
$result =~ s/“/「/g;
$result =~ s/”/」/g;
print $result;
